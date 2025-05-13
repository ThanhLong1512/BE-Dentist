const Appointment = require("../models/AppointmentModel");
const Patient = require("../models/PatientModel");
const Employee = require("../models/EmployeeModel");
const Shift = require("../models/ShiftModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const getAppointments = catchAsync((req, res, next) => {
  // const appointments = await Appointment.find()
  //   .populate("patient")
  //   .populate("service");
  res.status(200).json({
    status: "success"
    // data: {
    //   appointments
    // }
  });
});
const getAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("patient")
    .populate("service");
  if (!appointment) {
    return next(new AppError("No appointment found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      appointment
    }
  });
});
const createAppointment = catchAsync(async (req, res, next) => {
  try {
    const { shift, Date } = req.body;
    const patientId = req.user.id;

    const appointment = await Appointment.create({
      patient: patientId,
      shift: shift,
      Date: Date
    });

    // Update shift's isBooked status
    await Shift.findByIdAndUpdate(shift, { isBooked: true });

    // Get populated appointment data
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
    // If there's an error, ensure we handle it properly
    return next(new AppError(error.message, 400));
  }
});

const updateAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  if (!appointment) {
    return next(new AppError("No appointment found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      appointment
    }
  });
});

const deleteAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) {
    return next(new AppError("No appointment found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null
  });
});
const appointmentController = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
module.exports = appointmentController;
