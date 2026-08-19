const Appointment = require("../models/AppointmentModel");
const Patient = require("../models/PatientModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const { StatusCodes } = require("http-status-codes");
const {
  holdSeat,
  expireReservationById
} = require("../services/reservationService");
const { releaseHold } = require("../utils/holdSeat");
const AppointmentReservation = require("../models/AppointmentReservationModel");
const {
  updateAppointmentStatus,
  rescheduleAppointment
} = require("../services/appointmentStatusService");
const { cancelAppointmentReminders, scheduleAppointmentReminders } = require("../services/appointmentNotificationService");
const { emitAppointmentUpdated } = require("../providers/socketProvider");

exports.holdAppointment = catchAsync(async (req, res) => {
  const { shift, Date: appointmentDate } = req.body;

  if (!shift || !appointmentDate) {
    throw new AppError("Please provide shift and Date", 400);
  }

  const result = await holdSeat({
    accountId: req.user.id,
    shiftId: shift,
    dateInput: appointmentDate
  });

  res.status(StatusCodes.CREATED).json({
    status: "success",
    message: "Seat held successfully. Complete payment within 5 minutes.",
    data: result
  });
});

exports.createAppointment = catchAsync(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new AppError(
      "Direct booking is disabled. Use POST /appointments/hold and complete payment.",
      400
    );
  }

  const { shift, Date: appointmentDate } = req.body;
  const patient = await Patient.findOne({ account: req.body.account || req.user.id });

  if (!patient) {
    throw new AppError("No patient profile found", 404);
  }

  const appointment = await Appointment.create({
    patient: patient._id,
    shift,
    Date: appointmentDate
  });

  await scheduleAppointmentReminders(appointment._id);
  const populated = await Appointment.findById(appointment._id);
  emitAppointmentUpdated(populated);

  res.status(201).json({
    status: "success",
    message: "Book appointment successfully",
    data: { appointment: populated }
  });
});

exports.getAppointmentByUser = catchAsync(async (req, res) => {
  const userID = req.user.id;
  if (!userID) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Please Login to check your appointment"
    });
  }
  const patient = await Patient.findOne({ account: userID });

  if (!patient) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "No patient profile found for this account"
    });
  }
  const appointments = await Appointment.find({ patient: patient._id });

  if (!appointments || appointments.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "No appointments found for this account"
    });
  }

  return res.status(StatusCodes.OK).json({
    status: "Successful",
    data: {
      data: appointments
    }
  });
});

exports.getAppointmentByPeriod = catchAsync(async (req, res, next) => {
  const { period } = req.params;

  const validPeriods = [7, 30, 90];
  const periodNumber = parseInt(period);

  if (!validPeriods.includes(periodNumber)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "error",
      message: "Invalid period. Please use 7, 30, or 90 days"
    });
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - periodNumber);

  const appointments = await Appointment.find({
    Date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ Date: -1 });

  return res.status(StatusCodes.OK).json({
    status: "Successful",
    data: {
      count: appointments.length
    }
  });
});

exports.updateAppointmentStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    throw new AppError("Please provide status", 400);
  }

  const { appointment } = await updateAppointmentStatus(
    req.params.id,
    status,
    req.user
  );

  res.status(StatusCodes.OK).json({
    status: "success",
    data: { appointment }
  });
});

exports.rescheduleAppointment = catchAsync(async (req, res) => {
  const { Date: appointmentDate, shift, reason } = req.body;
  if (!appointmentDate && !shift) {
    throw new AppError("Please provide Date and/or shift to reschedule", 400);
  }

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

exports.deleteAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return next(new AppError("No document found with that ID", 404));
  }

  await cancelAppointmentReminders(req.params.id);
  await Appointment.findByIdAndDelete(req.params.id);

  const reservation = await AppointmentReservation.findOne({
    appointment: req.params.id
  });
  if (reservation) {
    reservation.status = "cancelled";
    await reservation.save();
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.cancelReservation = catchAsync(async (req, res) => {
  const { reservationId } = req.params;
  const reservation = await AppointmentReservation.findById(reservationId).populate(
    "patient"
  );

  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }

  if (String(reservation.patient.account) !== String(req.user.id)) {
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
    String(reservation._id)
  );

  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Reservation cancelled successfully"
  });
});

exports.getAllAppointments = factory.getAll(Appointment);
exports.getAppointment = factory.getOne(Appointment);
exports.updateAppointment = factory.updateOne(Appointment);
