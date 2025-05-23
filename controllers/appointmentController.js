const Appointment = require("../models/AppointmentModel");
const Patient = require("../models/PatientModel");
const Shift = require("../models/ShiftModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const { StatusCodes } = require("http-status-codes");

exports.createAppointment = catchAsync(async (req, res, next) => {
  try {
    const { shift, Date } = req.body;

    const patient = await Patient.findOne({ account: req.user.id });

    const appointment = await Appointment.create({
      patient: patient._id,
      shift: shift,
      Date: Date
    });
    await Shift.findByIdAndUpdate(shift, { isBooked: false });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patient", "name email phone")
      .populate({
        path: "shift",
        populate: {
          path: "employee",
          populate: {
            path: "service"
          }
        }
      });

    res.status(201).json({
      status: "success",
      message: "Book appointment successfully"
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
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
exports.getAllAppointments = factory.getAll(Appointment);
exports.getAppointment = factory.getOne(Appointment);
exports.updateAppointment = factory.updateOne(Appointment);
exports.deleteAppointment = factory.deleteOne(Appointment);
