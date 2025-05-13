const Shift = require("../models/ShiftModel");
const Employee = require("../models/EmployeeModel");

exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find().populate({
      path: "employee",
      populate: {
        path: "service",
        model: "Service"
      }
    });
    res.status(200).json({
      status: "success",
      data: shifts
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

exports.getShiftsByDayOfWeek = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const shifts = await Shift.find({ DayOfWeek: dayOfWeek }).populate({
      path: "employee",
      populate: {
        path: "service",
        model: "Service"
      }
    });

    res.status(200).json({
      status: "success",
      data: shifts
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Get a single shift
exports.getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id).populate({
      path: "employee",
      populate: {
        path: "service",
        model: "Service"
      }
    });

    if (!shift) {
      return res.status(404).json({
        status: "error",
        message: "Shift not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: shift
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

exports.createShift = async (req, res) => {
  try {
    const newShift = await Shift.create(req.body);
    res.status(201).json({
      status: "success",
      data: newShift
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!shift) {
      return res.status(404).json({
        status: "error",
        message: "Shift not found"
      });
    }
    res.status(200).json({
      status: "success",
      data: shift
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) {
      return res.status(404).json({
        status: "error",
        message: "Shift not found"
      });
    }
    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};
