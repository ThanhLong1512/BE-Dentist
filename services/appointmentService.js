const Appointment = require("../models/AppointmentModel");
const Patient = require("../models/PatientModel");
const AppointmentReservation = require("../models/AppointmentReservationModel");
const AppError = require("../utils/appError");
const { releaseHold } = require("../utils/holdSeat");
const {
  cancelAppointmentReminders,
  scheduleAppointmentReminders
} = require("./appointmentNotificationService");
const { emitAppointmentUpdated } = require("../providers/socketProvider");
const { invalidateSlotCacheByDateKey } = require("./slotCacheService");
const { getSlotDateKey } = require("../utils/slotDate");
const {
  indexAppointment,
  deleteAppointment: deleteAppointmentFromSearch
} = require("../search/indexer");

const createAdminAppointment = async ({
  accountId,
  shift,
  dateInput,
  actorRole
}) => {
  if (actorRole !== "admin") {
    throw new AppError(
      "Direct booking is disabled. Use POST /appointments/hold and complete payment.",
      400
    );
  }

  const patient = await Patient.findOne({ account: accountId });
  if (!patient) {
    throw new AppError("No patient profile found", 404);
  }

  const appointment = await Appointment.create({
    patient: patient._id,
    shift,
    Date: dateInput
  });

  await scheduleAppointmentReminders(appointment._id);
  const populated = await Appointment.findById(appointment._id);
  emitAppointmentUpdated(populated);
  await indexAppointment(appointment._id);

  return populated;
};

const getAppointmentsForAccount = async accountId => {
  if (!accountId) {
    throw new AppError("Please Login to check your appointment", 401);
  }

  const patient = await Patient.findOne({ account: accountId });
  if (!patient) {
    throw new AppError("No patient profile found for this account", 404);
  }

  const appointments = await Appointment.find({ patient: patient._id });
  if (!appointments || appointments.length === 0) {
    throw new AppError("No appointments found for this account", 404);
  }

  return appointments;
};

const getAppointmentCountByPeriod = async periodNumber => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - periodNumber);

  const appointments = await Appointment.find({
    Date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ Date: -1 });

  return appointments.length;
};

const deleteAppointmentById = async appointmentId => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new AppError("No document found with that ID", 404);
  }

  await cancelAppointmentReminders(appointmentId);
  await Appointment.findByIdAndDelete(appointmentId);
  await deleteAppointmentFromSearch(appointmentId);

  const reservation = await AppointmentReservation.findOne({
    appointment: appointmentId
  });
  if (reservation) {
    reservation.status = "cancelled";
    await reservation.save();
  }

  if (appointment.Date) {
    await invalidateSlotCacheByDateKey({
      dateKey: getSlotDateKey(appointment.Date)
    });
  }

  return true;
};

const cancelReservationByUser = async ({ reservationId, accountId }) => {
  const reservation = await AppointmentReservation.findById(reservationId).populate(
    "patient"
  );

  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }

  if (String(reservation.patient.account) !== String(accountId)) {
    throw new AppError("You are not allowed to cancel this reservation", 403);
  }

  if (reservation.status !== "pending") {
    throw new AppError("Only pending reservations can be cancelled", 409);
  }

  reservation.status = "cancelled";
  await reservation.save();
  await releaseHold(
    reservation.shift,
    reservation.Date,
    String(reservation._id),
    reservation.slotStart
  );

  if (reservation.Date) {
    await invalidateSlotCacheByDateKey({
      dateKey: getSlotDateKey(reservation.Date)
    });
  }

  return true;
};

module.exports = {
  createAdminAppointment,
  getAppointmentsForAccount,
  getAppointmentCountByPeriod,
  deleteAppointmentById,
  cancelReservationByUser
};
