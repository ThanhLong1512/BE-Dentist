const Shift = require("./../models/ShiftModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const { isSlotAvailable } = require("../services/reservationService");
const { normalizeSlotDate } = require("../utils/slotDate");

exports.getShiftsByDayOfWeek = catchAsync(async (req, res) => {
  const { dayOfWeek } = req.params;
  const { date } = req.query;

  const shifts = await Shift.find({ DayOfWeek: dayOfWeek });

  if (!date) {
    return res.status(200).json({
      status: "success",
      data: shifts
    });
  }

  const slotDate = normalizeSlotDate(date);
  const availabilityChecks = await Promise.all(
    shifts.map(async shift => ({
      shift,
      available: await isSlotAvailable(shift._id, slotDate)
    }))
  );

  const availableShifts = availabilityChecks
    .filter(item => item.available)
    .map(item => item.shift);

  res.status(200).json({
    status: "success",
    data: availableShifts,
    meta: {
      date: slotDate,
      total: shifts.length,
      availableCount: availableShifts.length
    }
  });
});

exports.getAllShift = factory.getAll(Shift);
exports.getShift = factory.getOne(Shift);
exports.createShift = factory.createOne(Shift);
exports.updateShift = factory.updateOne(Shift);
exports.deleteShift = factory.deleteOne(Shift);
