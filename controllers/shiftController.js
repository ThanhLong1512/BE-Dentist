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

exports.createBatchShifts = catchAsync(async (req, res) => {
  const { employee, shifts } = req.body;

  if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "Vui lòng cung cấp danh sách ca làm việc cần tạo!"
    });
  }

  // Find existing shifts for this employee to prevent duplicates
  const existing = await Shift.find({
    employee: employee
  });

  const existingMap = new Set(
    existing.map(s => `${s.DayOfWeek}_${s.StartTime}_${s.EndTime}`)
  );

  const newShiftsToInsert = [];
  const skippedShifts = [];

  for (const s of shifts) {
    const key = `${s.DayOfWeek}_${s.StartTime}_${s.EndTime}`;
    if (existingMap.has(key)) {
      skippedShifts.push(s);
    } else {
      newShiftsToInsert.push({
        employee: s.employee || employee,
        DayOfWeek: s.DayOfWeek,
        StartTime: s.StartTime,
        EndTime: s.EndTime,
        isBooked: false,
        breaks: s.breaks || [],
        slotIntervalMinutes: s.slotIntervalMinutes || 15
      });
      existingMap.add(key);
    }
  }

  let createdShifts = [];
  if (newShiftsToInsert.length > 0) {
    createdShifts = await Shift.insertMany(newShiftsToInsert);
  }

  res.status(201).json({
    status: "success",
    message: `Đã tạo thành công ${createdShifts.length} ca làm việc!`,
    data: {
      createdCount: createdShifts.length,
      skippedCount: skippedShifts.length,
      shifts: createdShifts
    }
  });
});

exports.getAllShift = factory.getAll(Shift);
exports.getShift = factory.getOne(Shift);
exports.createShift = factory.createOne(Shift);
exports.updateShift = factory.updateOne(Shift);
exports.deleteShift = factory.deleteOne(Shift);
