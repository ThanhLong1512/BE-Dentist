const mongoose = require("mongoose");
const Service = require("../models/ServicesModel");
const Shift = require("../models/ShiftModel");
const Appointment = require("../models/AppointmentModel");
const AppointmentReservation = require("../models/AppointmentReservationModel");
const { getRedis, safeRedisOperation } = require("../providers/RedisProvider");
const { getDayRange, getSlotDateKey } = require("../utils/slotDate");
const {
  parseTimeToMinutes,
  formatMinutesToTime,
  rangesOverlap,
  subtractBreaks,
  getDayOfWeekString,
} = require("../utils/timeSlot");

const HOLD_KEY_APPT = (shiftId, dateKey) => `hold:appt:${shiftId}:${dateKey}`;
const HOLD_KEY_SLOT = (shiftId, dateKey, slotStart) =>
  `hold:slot:${shiftId}:${dateKey}:${slotStart}`;

const isBusyOverlap = (candidateStart, candidateEnd, busyBlocks) => {
  for (const b of busyBlocks) {
    if (rangesOverlap(candidateStart, candidateEnd, b.start, b.end)) return true;
  }
  return false;
};

const getWorkSegments = (shiftDoc) => {
  const workStart = parseTimeToMinutes(shiftDoc.StartTime);
  const workEnd = parseTimeToMinutes(shiftDoc.EndTime);
  return subtractBreaks(workStart, workEnd, shiftDoc.breaks || []);
};

const loadShiftsForDate = async ({ date, employeeId, shiftId }) => {
  if (shiftId) {
    const s = await Shift.findById(shiftId).populate({ path: "employee", select: "name" });
    return s ? [s] : [];
  }

  const dayOfWeek = getDayOfWeekString(date);

  if (employeeId) {
    const shifts = await Shift.find({ DayOfWeek: dayOfWeek, employee: employeeId }).populate({
      path: "employee",
      select: "name",
    });
    return shifts;
  }

  return Shift.find({ DayOfWeek: dayOfWeek }).populate({ path: "employee", select: "name" });
};

const getBusyBlocksForEmployeeOnDate = async ({
  employeeId,
  date,
  bufferMinutes,
}) => {
  const { start, end } = getDayRange(date);

  // Appointment busy blocks (exclude cancelled/completed)
  const appointmentBusy = await Appointment.aggregate([
    { $match: { Date: { $gte: start, $lte: end } } },
    {
      $lookup: {
        from: "shifts",
        localField: "shift",
        foreignField: "_id",
        as: "shiftDoc",
      },
    },
    { $unwind: "$shiftDoc" },
    { $match: { "shiftDoc.employee": mongoose.Types.ObjectId(employeeId) } },
    {
      $match: {
        status: { $nin: ["cancelled", "completed"] },
      },
    },
    {
      $project: {
        slotStart: 1,
        slotEnd: 1,
        status: 1,
        shiftStartTime: "$shiftDoc.StartTime",
        shiftEndTime: "$shiftDoc.EndTime",
      },
    },
    { $match: { $or: [{ slotStart: { $ne: null } }, { shiftStartTime: { $ne: null } }] } },
  ]);

  // Pending reservations busy blocks
  const reservationBusy = await AppointmentReservation.aggregate([
    { $match: { Date: { $gte: start, $lte: end }, status: "pending" } },
    {
      $lookup: {
        from: "shifts",
        localField: "shift",
        foreignField: "_id",
        as: "shiftDoc",
      },
    },
    { $unwind: "$shiftDoc" },
    { $match: { "shiftDoc.employee": mongoose.Types.ObjectId(employeeId) } },
    { $project: { slotStart: 1, slotEnd: 1, expiresAt: 1, shiftStartTime: "$shiftDoc.StartTime", shiftEndTime: "$shiftDoc.EndTime" } },
    // Reservation TTL: reservation might not be expired yet; we only count active ones.
    { $match: { expiresAt: { $gt: new Date() } } },
  ]);

  const toMin = (t, fallback) => {
    if (t) return parseTimeToMinutes(t);
    if (fallback) return parseTimeToMinutes(fallback);
    return null;
  };

  const busyBlocks = [];
  for (const a of appointmentBusy) {
    const s = toMin(a.slotStart, a.shiftStartTime);
    const e = toMin(a.slotEnd, a.shiftEndTime);
    if (s === null || e === null) continue;
    busyBlocks.push({ start: s, end: e + bufferMinutes });
  }
  for (const r of reservationBusy) {
    const s = toMin(r.slotStart, r.shiftStartTime);
    const e = toMin(r.slotEnd, r.shiftEndTime);
    if (s === null || e === null) continue;
    busyBlocks.push({ start: s, end: e + bufferMinutes });
  }

  return busyBlocks;
};

const getHoldKeyForShiftDate = async (shiftId, dateKey) =>
  safeRedisOperation(async () => {
    const redis = getRedis().instanceConnect;
    const exists = await redis.exists(HOLD_KEY_APPT(shiftId, dateKey));
    return exists === 1;
  }, false);

const checkSlotHold = async ({ shiftId, dateKey, slotStart }) =>
  safeRedisOperation(async () => {
    const redis = getRedis().instanceConnect;
    const exists = await redis.exists(HOLD_KEY_SLOT(shiftId, dateKey, slotStart));
    return exists === 1;
  }, false);

const generateAvailableSlots = async ({ date, serviceId, employeeId, shiftId }) => {
  const slotDate = new Date(date);
  if (Number.isNaN(slotDate.getTime())) throw new Error("Invalid date");

  const dateKey = getSlotDateKey(slotDate);
  const service = await Service.findById(serviceId);
  if (!service) return [];

  const durationMinutes = service.durationMinutes ?? 30;
  const bufferMinutes = service.bufferMinutes ?? 10;
  const totalBlockMinutes = durationMinutes + bufferMinutes;

  const shifts = await loadShiftsForDate({ date: slotDate, employeeId, shiftId });
  if (!shifts.length) return [];

  const slots = [];

  for (const shiftDoc of shifts) {
    const shiftEmployeeId = employeeId || shiftDoc.employee;
    if (!shiftEmployeeId) continue;

    // Busy blocks are computed for the employee across all his/her shifts in the day.
    const busyBlocks = await getBusyBlocksForEmployeeOnDate({
      employeeId: shiftEmployeeId,
      date: slotDate,
      bufferMinutes,
    });

    const segments = getWorkSegments(shiftDoc);
    const slotIntervalMinutes = shiftDoc.slotIntervalMinutes ?? 15;

    const shouldBlockAllForShift = await getHoldKeyForShiftDate(
      String(shiftDoc._id),
      dateKey
    );
    if (shouldBlockAllForShift) continue;

    for (const seg of segments) {
      for (
        let t = seg.start;
        t + totalBlockMinutes <= seg.end;
        t += slotIntervalMinutes
      ) {
        const slotStartMin = t;
        const slotEndMin = t + durationMinutes;

        const candidateStart = slotStartMin;
        const candidateEnd = slotStartMin + totalBlockMinutes;

        if (isBusyOverlap(candidateStart, candidateEnd, busyBlocks)) continue;

        const slotStart = formatMinutesToTime(slotStartMin);
        const slotEnd = formatMinutesToTime(slotEndMin);

        // Redis slot-hold (granular) check.
        const slotIsHeld = await checkSlotHold({
          shiftId: String(shiftDoc._id),
          dateKey,
          slotStart,
        });
        if (slotIsHeld) continue;

        slots.push({
          shiftId: shiftDoc._id.toString(),
          employeeId: String(shiftEmployeeId),
          doctorName: shiftDoc.employee?.name || null,
          slotStart,
          slotEnd,
          durationMinutes,
          serviceId: service._id.toString(),
          price: service.priceDiscount ?? service.priceService,
        });
      }
    }
  }

  // sort by slot time
  slots.sort((a, b) => parseTimeToMinutes(a.slotStart) - parseTimeToMinutes(b.slotStart));
  return slots;
};

module.exports = {
  generateAvailableSlots,
};

