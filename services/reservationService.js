const mongoose = require("mongoose");
const Appointment = require("../models/AppointmentModel");
const AppointmentReservation = require("../models/AppointmentReservationModel");
const Patient = require("../models/PatientModel");
const Shift = require("../models/ShiftModel");
const AppError = require("../utils/appError");
const {
  getHoldTtlSeconds,
  acquireHold,
  releaseHold,
  getHold,
  extendHold,
  acquireConfirmLock,
  releaseConfirmLock
} = require("../utils/holdSeat");
const { normalizeSlotDate, getDayRange } = require("../utils/slotDate");
const { scheduleAppointmentReminders } = require("./appointmentNotificationService");
const { emitAppointmentUpdated } = require("../providers/socketProvider");

const expireStaleReservations = async (shiftId, slotDate) => {
  const { start, end } = getDayRange(slotDate);
  await AppointmentReservation.updateMany(
    {
      shift: shiftId,
      Date: { $gte: start, $lte: end },
      status: "pending",
      expiresAt: { $lte: new Date() }
    },
    { status: "expired" }
  );
};

const hasConfirmedAppointment = async (shiftId, slotDate, excludeAppointmentId = null) => {
  const { start, end } = getDayRange(slotDate);
  const existing = await Appointment.findOne({
    shift: shiftId,
    Date: { $gte: start, $lte: end },
    ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {})
  });
  return Boolean(existing);
};

const isSlotAvailable = async (
  shiftId,
  slotDate,
  excludeReservationId = null,
  excludeAppointmentId = null
) => {
  await expireStaleReservations(shiftId, slotDate);

  if (await hasConfirmedAppointment(shiftId, slotDate, excludeAppointmentId)) {
    return false;
  }

  const activeHold = await getHold(shiftId, slotDate);
  if (activeHold && activeHold !== excludeReservationId) {
    return false;
  }

  const { start, end } = getDayRange(slotDate);
  const pendingReservation = await AppointmentReservation.findOne({
    shift: shiftId,
    Date: { $gte: start, $lte: end },
    status: "pending",
    expiresAt: { $gt: new Date() },
    ...(excludeReservationId ? { _id: { $ne: excludeReservationId } } : {})
  });

  return !pendingReservation;
};

const holdSeat = async ({ accountId, shiftId, dateInput }) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  const patient = await Patient.findOne({ account: accountId });
  if (!patient) {
    throw new AppError("No patient profile found for this account", 404);
  }

  const slotDate = normalizeSlotDate(dateInput);
  const available = await isSlotAvailable(shiftId, slotDate);
  if (!available) {
    throw new AppError("This time slot is not available", 409);
  }

  const expiresAt = new Date(Date.now() + getHoldTtlSeconds() * 1000);
  const reservation = await AppointmentReservation.create({
    patient: patient._id,
    shift: shiftId,
    Date: slotDate,
    status: "pending",
    expiresAt
  });

  const acquired = await acquireHold(shiftId, slotDate, String(reservation._id));
  if (!acquired) {
    await AppointmentReservation.findByIdAndDelete(reservation._id);
    throw new AppError("This time slot is being booked by someone else", 409);
  }

  return {
    reservationId: reservation._id,
    expiresAt: reservation.expiresAt,
    holdSeconds: getHoldTtlSeconds()
  };
};

const getReservationForPayment = async (reservationId, accountId) => {
  await expireReservationIfNeeded(reservationId);

  const reservation = await AppointmentReservation.findById(reservationId).populate(
    "patient"
  );
  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }

  if (reservation.status !== "pending") {
    throw new AppError("Reservation is no longer valid", 409);
  }

  if (reservation.expiresAt <= new Date()) {
    throw new AppError("Reservation has expired", 409);
  }

  if (String(reservation.patient.account) !== String(accountId)) {
    throw new AppError("You are not allowed to pay for this reservation", 403);
  }

  const holdOwner = await getHold(reservation.shift, reservation.Date);
  if (holdOwner !== String(reservation._id)) {
    throw new AppError("Hold seat has expired. Please book again", 409);
  }

  await extendHold(reservation.shift, reservation.Date, String(reservation._id));
  return reservation;
};

const expireReservationIfNeeded = async reservationId => {
  const reservation = await AppointmentReservation.findById(reservationId);
  if (!reservation || reservation.status !== "pending") {
    return reservation;
  }

  if (reservation.expiresAt <= new Date()) {
    reservation.status = "expired";
    await reservation.save();
    await releaseHold(
      reservation.shift,
      reservation.Date,
      String(reservation._id)
    );
  }

  return reservation;
};

const expireReservationById = async reservationId => {
  const reservation = await AppointmentReservation.findById(reservationId);
  if (!reservation || reservation.status !== "pending") {
    return;
  }

  reservation.status = "expired";
  await reservation.save();
};

const confirmReservationFromPayment = async ({
  reservationId,
  paymentMethod,
  paymentRef,
  totalPrice,
  accountId,
  serviceIds
}) => {
  const lockAcquired = await acquireConfirmLock(reservationId);
  if (!lockAcquired) {
    throw new AppError("Payment confirmation is already in progress", 409);
  }

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const reservation = await AppointmentReservation.findById(reservationId)
        .populate("patient")
        .session(session);

      if (!reservation) {
        throw new AppError("Reservation not found", 404);
      }

      if (reservation.status === "confirmed") {
        result = { reservation, appointment: reservation.appointment, alreadyConfirmed: true };
        return;
      }

      if (reservation.status !== "pending") {
        throw new AppError("Reservation is no longer valid", 409);
      }

      if (reservation.expiresAt <= new Date()) {
        reservation.status = "expired";
        await reservation.save({ session });
        throw new AppError("Reservation has expired", 409);
      }

      if (String(reservation.patient.account) !== String(accountId)) {
        throw new AppError("Invalid reservation owner", 403);
      }

      const { start, end } = getDayRange(reservation.Date);
      const existingAppointment = await Appointment.findOne({
        shift: reservation.shift,
        Date: { $gte: start, $lte: end }
      }).session(session);

      if (existingAppointment) {
        throw new AppError("This time slot is already booked", 409);
      }

      const [appointment] = await Appointment.create(
        [
          {
            patient: reservation.patient._id,
            shift: reservation.shift,
            Date: reservation.Date
          }
        ],
        { session }
      );

      reservation.status = "confirmed";
      reservation.paymentMethod = paymentMethod;
      reservation.paymentRef = paymentRef;
      reservation.appointment = appointment._id;
      await reservation.save({ session });

      result = {
        reservation,
        appointment,
        alreadyConfirmed: false,
        totalPrice,
        accountId,
        serviceIds
      };
    });

    if (result?.reservation) {
      await releaseHold(
        result.reservation.shift,
        result.reservation.Date,
        String(result.reservation._id)
      );
    }

    if (result?.appointment && !result.alreadyConfirmed) {
      await scheduleAppointmentReminders(result.appointment._id);
      const populated = await Appointment.findById(result.appointment._id);
      emitAppointmentUpdated(populated);
    }

    return result;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("This time slot is already booked", 409);
    }
    throw error;
  } finally {
    await releaseConfirmLock(reservationId);
    session.endSession();
  }
};

const expireReservationsForHoldKey = async holdKey => {
  const parts = holdKey.split(":");
  if (parts.length < 4) return;
  const shiftId = parts[2];
  const dateKey = parts.slice(3).join(":");
  const slotDate = new Date(dateKey + "T00:00:00.000Z");
  const { start, end } = getDayRange(slotDate);
  await AppointmentReservation.updateMany(
    {
      shift: shiftId,
      Date: { $gte: start, $lte: end },
      status: "pending"
    },
    { status: "expired" }
  );
};

module.exports = {
  holdSeat,
  isSlotAvailable,
  getReservationForPayment,
  expireReservationIfNeeded,
  expireReservationById,
  confirmReservationFromPayment,
  hasConfirmedAppointment,
  expireReservationsForHoldKey
};
