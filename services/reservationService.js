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
const { normalizeSlotDate, getDayRange, getSlotDateKey } = require("../utils/slotDate");
const { scheduleAppointmentReminders } = require("./appointmentNotificationService");
const { emitAppointmentUpdated } = require("../providers/socketProvider");
const { invalidateSlotCacheByDateKey } = require("./slotCacheService");
const { generateAvailableSlots } = require("./slotGenerationService");
const { indexAppointment } = require("../search/indexer");

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
    status: { $nin: ["cancelled", "completed"] },
    ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {})
  });
  return Boolean(existing);
};

const isSlotAvailable = async (
  shiftId,
  slotDate,
  excludeReservationId = null,
  excludeAppointmentId = null,
  slotStart = null,
  serviceId = null
) => {
  // Slot-level availability: tinh theo duration + buffer + overlap.
  if (slotStart && serviceId) {
    const slots = await generateAvailableSlots({
      date: slotDate,
      serviceId,
      shiftId,
    });
    return Boolean(slots.find(s => s.slotStart === slotStart));
  }

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

const holdSeat = async ({
  accountId,
  shiftId,
  dateInput,
  serviceId = null,
  slotStart = null,
  slotEnd = null,
}) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  const patient = await Patient.findOne({ account: accountId });
  if (!patient) {
    throw new AppError("No patient profile found for this account", 404);
  }

  const slotDate = normalizeSlotDate(dateInput);

  // Slot-level hold (service + slotStart).
  if (serviceId && slotStart) {
    const slots = await generateAvailableSlots({
      date: slotDate,
      serviceId,
      shiftId,
    });
    const slot = slots.find(s => s.slotStart === slotStart);
    if (!slot) {
      throw new AppError("This time slot is not available", 409);
    }

    const expiresAt = new Date(Date.now() + getHoldTtlSeconds() * 1000);
    const reservation = await AppointmentReservation.create({
      patient: patient._id,
      shift: shiftId,
      Date: slotDate,
      slotStart: slot.slotStart,
      slotEnd: slot.slotEnd,
      service: serviceId,
      durationMinutes: slot.durationMinutes,
      status: "pending",
      expiresAt,
    });

    const acquired = await acquireHold(
      shiftId,
      slotDate,
      String(reservation._id),
      slot.slotStart
    );
    if (!acquired) {
      await AppointmentReservation.findByIdAndDelete(reservation._id);
      throw new AppError("This time slot is being booked by someone else", 409);
    }

    await invalidateSlotCacheByDateKey({
      dateKey: getSlotDateKey(slotDate),
    });

    return {
      reservationId: reservation._id,
      expiresAt: reservation.expiresAt,
      holdSeconds: getHoldTtlSeconds(),
      slotStart: reservation.slotStart,
      slotEnd: reservation.slotEnd,
      durationMinutes: reservation.durationMinutes,
      serviceId: reservation.service,
    };
  }

  // Backward-compatible: hold entire shift (shift + day).
  const available = await isSlotAvailable(shiftId, slotDate);
  if (!available) throw new AppError("This time slot is not available", 409);

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

  // Invalidate cache slot theo ngay (broad invalidation - dam bao dung).
  await invalidateSlotCacheByDateKey({
    dateKey: getSlotDateKey(slotDate)
  });

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

  const holdOwner = await getHold(
    reservation.shift,
    reservation.Date,
    reservation.slotStart
  );
  if (holdOwner !== String(reservation._id)) {
    throw new AppError("Hold seat has expired. Please book again", 409);
  }

  await extendHold(
    reservation.shift,
    reservation.Date,
    String(reservation._id),
    reservation.slotStart
  );
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
      String(reservation._id),
      reservation.slotStart
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
      const existingAppointmentQuery = {
        shift: reservation.shift,
        Date: { $gte: start, $lte: end }
      };
      existingAppointmentQuery.status = { $nin: ["cancelled", "completed"] };

      if (reservation.slotStart) {
        existingAppointmentQuery.slotStart = reservation.slotStart;
      }

      const existingAppointment = await Appointment.findOne(
        existingAppointmentQuery
      ).session(session);

      if (existingAppointment) {
        throw new AppError("This time slot is already booked", 409);
      }

      const [appointment] = await Appointment.create(
        [
          {
            patient: reservation.patient._id,
            shift: reservation.shift,
            Date: reservation.Date,
            slotStart: reservation.slotStart,
            slotEnd: reservation.slotEnd,
            service: reservation.service,
            durationMinutes: reservation.durationMinutes,
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
        String(result.reservation._id),
        result.reservation.slotStart
      );
    }

    if (result?.appointment && !result.alreadyConfirmed) {
      await scheduleAppointmentReminders(result.appointment._id);
      const populated = await Appointment.findById(result.appointment._id);
      emitAppointmentUpdated(populated);

      // Update Elasticsearch index for appointment search.
      await indexAppointment(result.appointment._id);

      if (result?.reservation?.Date) {
        await invalidateSlotCacheByDateKey({
          dateKey: getSlotDateKey(result.reservation.Date),
        });
      }
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
  // hold:appt:{shiftId}:{dateKey}
  // hold:slot:{shiftId}:{dateKey}:{slotStart}
  if (parts.length < 4) return;

  const shiftId = parts[2];
  const isSlot = parts[1] === "slot";
  const dateKey = parts[3];
  const slotStart = isSlot ? parts[4] : null;

  const slotDate = new Date(dateKey + "T00:00:00.000Z");
  const { start, end } = getDayRange(slotDate);

  const match = {
    shift: shiftId,
    Date: { $gte: start, $lte: end },
    status: "pending"
  };

  if (slotStart) match.slotStart = slotStart;

  await AppointmentReservation.updateMany(
    match,
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
