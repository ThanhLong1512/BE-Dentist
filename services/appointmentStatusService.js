const Appointment = require("../models/AppointmentModel");
const AppError = require("../utils/appError");
const { isSlotAvailable } = require("./reservationService");
const {
  scheduleAppointmentReminders,
  cancelAppointmentReminders,
  queueScheduleChangeNotification
} = require("./appointmentNotificationService");
const {
  emitAppointmentUpdated,
  emitNotification
} = require("../providers/socketProvider");

const VALID_STATUSES = [
  "scheduled",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "rescheduled"
];

const STATUS_LABELS = {
  scheduled: "Da dat lich",
  checked_in: "Da den phong kham",
  in_progress: "Dang trong ca",
  completed: "Hoan thanh",
  cancelled: "Da huy",
  rescheduled: "Da doi lich"
};

const populateAppointment = query =>
  query.populate([
    { path: "patient", populate: { path: "account" } },
    {
      path: "shift",
      populate: { path: "employee", populate: { path: "service" } }
    }
  ]);

const updateAppointmentStatus = async (appointmentId, status, actorUser) => {
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError("Invalid appointment status", 400);
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new AppError("Appointment not found", 404);

  appointment.status = status;
  appointment.statusHistory = appointment.statusHistory || [];
  appointment.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: actorUser && actorUser.id
  });

  if (status === "cancelled") {
    await cancelAppointmentReminders(appointmentId);
  }

  await appointment.save();
  const populated = await populateAppointment(Appointment.findById(appointmentId));

  emitAppointmentUpdated(populated);
  emitNotification({
    userId: populated.patient && populated.patient.account ? populated.patient.account._id.toString() : undefined,
    title: "Cap nhat trang thai lich kham",
    message: "Trang thai: " + STATUS_LABELS[status],
    type: "status_updated",
    appointmentId: populated._id.toString()
  });

  return { appointment: populated };
};

const rescheduleAppointment = async (appointmentId, payload, actorUser) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new AppError("Appointment not found", 404);

  const newShift = payload.shift || appointment.shift;
  const newDate = payload.Date ? new Date(payload.Date) : appointment.Date;

  const slotAvailable = await isSlotAvailable(
    newShift,
    newDate,
    null,
    appointmentId
  );
  if (!slotAvailable) {
    throw new AppError("This time slot is not available", 409);
  }

  if (payload.Date) appointment.Date = newDate;
  if (payload.shift) appointment.shift = payload.shift;
  appointment.status = "rescheduled";
  appointment.statusHistory = appointment.statusHistory || [];
  appointment.statusHistory.push({
    status: "rescheduled",
    changedAt: new Date(),
    changedBy: actorUser && actorUser.id,
    note: payload.reason
  });

  await appointment.save();
  await cancelAppointmentReminders(appointmentId);
  await scheduleAppointmentReminders(appointmentId);
  await queueScheduleChangeNotification(
    appointmentId,
    payload.reason || "Bac si/phong kham da thay doi lich hen cua ban."
  );

  const populated = await populateAppointment(Appointment.findById(appointmentId));
  emitAppointmentUpdated(populated);
  return populated;
};

module.exports = {
  VALID_STATUSES,
  STATUS_LABELS,
  updateAppointmentStatus,
  rescheduleAppointment
};
