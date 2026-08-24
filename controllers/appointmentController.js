const Appointment = require("../models/AppointmentModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const { StatusCodes } = require("http-status-codes");
const { holdSeat } = require("../services/reservationService");
const {
  updateAppointmentStatus,
  rescheduleAppointment
} = require("../services/appointmentStatusService");
const appointmentService = require("../services/appointmentService");

exports.holdAppointment = catchAsync(async (req, res) => {
  const {
    shift,
    Date: appointmentDate,
    serviceId,
    slotStart,
    slotEnd
  } = req.body;

  const result = await holdSeat({
    accountId: req.user.id,
    shiftId: shift,
    dateInput: appointmentDate,
    serviceId: serviceId || null,
    slotStart: slotStart || null,
    slotEnd: slotEnd || null
  });

  res.status(StatusCodes.CREATED).json({
    status: "success",
    message: "Seat held successfully. Complete payment within 5 minutes.",
    data: result
  });
});

exports.createAppointment = catchAsync(async (req, res) => {
  const { shift, Date: appointmentDate, account } = req.body;

  const populated = await appointmentService.createAdminAppointment({
    accountId: account || req.user.id,
    shift,
    dateInput: appointmentDate,
    actorRole: req.user.role
  });

  res.status(201).json({
    status: "success",
    message: "Book appointment successfully",
    data: { appointment: populated }
  });
});

exports.getAppointmentByUser = catchAsync(async (req, res) => {
  const appointments = await appointmentService.getAppointmentsForAccount(
    req.user.id
  );

  return res.status(StatusCodes.OK).json({
    status: "Successful",
    data: {
      data: appointments
    }
  });
});

exports.getAppointmentByPeriod = catchAsync(async (req, res) => {
  const periodNumber = parseInt(req.params.period, 10);
  const count = await appointmentService.getAppointmentCountByPeriod(
    periodNumber
  );

  return res.status(StatusCodes.OK).json({
    status: "Successful",
    data: {
      count
    }
  });
});

exports.updateAppointmentStatus = catchAsync(async (req, res) => {
  const { appointment } = await updateAppointmentStatus(
    req.params.id,
    req.body.status,
    req.user
  );

  res.status(StatusCodes.OK).json({
    status: "success",
    data: { appointment }
  });
});

exports.rescheduleAppointment = catchAsync(async (req, res) => {
  const { Date: appointmentDate, shift, reason } = req.body;

  const appointment = await rescheduleAppointment(
    req.params.id,
    { Date: appointmentDate, shift, reason },
    req.user
  );

  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Appointment rescheduled. Patient will be notified.",
    data: { appointment }
  });
});

exports.deleteAppointment = catchAsync(async (req, res) => {
  await appointmentService.deleteAppointmentById(req.params.id);

  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.cancelReservation = catchAsync(async (req, res) => {
  await appointmentService.cancelReservationByUser({
    reservationId: req.params.reservationId,
    accountId: req.user.id
  });

  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Reservation cancelled successfully"
  });
});

exports.getAllAppointments = factory.getAll(Appointment);
exports.getAppointment = factory.getOne(Appointment);
exports.updateAppointment = factory.updateOne(Appointment);
