const Shift = require("./../models/ShiftModel");
const factory = require("./handlerFactory");
const Employee = require("../models/EmployeeModel");

exports.getShiftsByDayOfWeek = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const shifts = await Shift.find({ DayOfWeek: dayOfWeek });
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

exports.getAllShift = factory.getAll(Shift);
exports.getShift = factory.getOne(Shift);
exports.createShift = factory.createOne(Shift);
exports.updateShift = factory.updateOne(Shift);
exports.deleteShift = factory.deleteOne(Shift);
