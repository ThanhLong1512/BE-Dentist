const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });

const mongoose = require("mongoose");

const { initRedis } = require("../providers/RedisProvider");
const { generateAvailableSlots } = require("../services/slotGenerationService");
const slotCacheService = require("../services/slotCacheService");
const reservationService = require("../services/reservationService");
const { releaseHold } = require("../utils/holdSeat");

const Service = require("../models/ServicesModel");
const Shift = require("../models/ShiftModel");
const Patient = require("../models/PatientModel");
const AppointmentReservation = require("../models/AppointmentReservationModel");

const {
  parseTimeToMinutes,
  rangesOverlap,
  getDayOfWeekString,
} = require("../utils/timeSlot");
const { getSlotDateKey } = require("../utils/slotDate");

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const DB_URI = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

async function main() {
  console.log("[e2eSlotEngineSmokeTest] Connecting to Mongo...");
  await mongoose.connect(DB_URI);

  console.log("[e2eSlotEngineSmokeTest] Initializing Redis...");
  await initRedis();

  const service = await Service.findOne({});
  if (!service) throw new Error("No Service found in DB");

  // Prefer a shift with breaks configured to test lunch break behavior.
  let shift = await Shift.findOne({ breaks: { $exists: true, $ne: [] } });
  if (!shift) shift = await Shift.findOne({});
  if (!shift) throw new Error("No Shift found in DB");

  // Find the next date that matches shift.DayOfWeek
  let testDate = null;
  for (let i = 0; i < 30; i += 1) {
    const candidate = addDays(new Date(), i);
    if (getDayOfWeekString(candidate) === shift.DayOfWeek) {
      testDate = candidate;
      break;
    }
  }

  if (!testDate) throw new Error(`Cannot find a date in next 30 days for ${shift.DayOfWeek}`);

  console.log(
    `[e2eSlotEngineSmokeTest] Using service=${service._id} duration=${service.durationMinutes} buffer=${service.bufferMinutes}, shift=${shift._id} day=${shift.DayOfWeek}, date=${testDate.toISOString().slice(0, 10)}`
  );

  const slotsBefore = await generateAvailableSlots({
    date: testDate,
    serviceId: service._id.toString(),
    shiftId: shift._id.toString(),
  });

  if (!slotsBefore.length) {
    throw new Error("No available slots found to test booking flow");
  }

  const bufferMinutes = service.bufferMinutes ?? 10;
  const durationMinutes = service.durationMinutes ?? 30;
  const totalBlockMinutes = durationMinutes + bufferMinutes;

  // 1) Lunch break check (if shift has breaks configured)
  if (Array.isArray(shift.breaks) && shift.breaks.length > 0) {
    const breakWindows = shift.breaks
      .filter((b) => b?.startTime && b?.endTime)
      .map((b) => ({
        start: parseTimeToMinutes(b.startTime),
        end: parseTimeToMinutes(b.endTime),
      }))
      .filter((w) => w.end > w.start);

    if (breakWindows.length > 0) {
      for (const slot of slotsBefore) {
        const slotStart = parseTimeToMinutes(slot.slotStart);
        const slotBlockEnd = slotStart + totalBlockMinutes;

        const overlapsBreak = breakWindows.some((bw) =>
          rangesOverlap(slotStart, slotBlockEnd, bw.start, bw.end)
        );
        if (overlapsBreak) {
          throw new Error(
            `Found a slot that overlaps lunch break. slotStart=${slot.slotStart} slotEnd=${slot.slotEnd}`
          );
        }
      }
      console.log("[e2eSlotEngineSmokeTest] Lunch break check: PASS");
    }
  } else {
    console.log("[e2eSlotEngineSmokeTest] Shift has no breaks; skip lunch break assertion.");
  }

  // 2) Buffer check
  const firstSlot = slotsBefore[0];
  const firstStart = parseTimeToMinutes(firstSlot.slotStart);
  const blockedStartMin = firstStart + totalBlockMinutes;
  const violating = slotsBefore.some((s) => {
    const ss = parseTimeToMinutes(s.slotStart);
    return ss > firstStart && ss < blockedStartMin;
  });

  if (violating) {
    throw new Error(
      "Buffer check failed: there exists another slot start inside the blocked window."
    );
  }
  console.log("[e2eSlotEngineSmokeTest] Buffer 10p check: PASS");

  // 3) Hold -> slot disappears + cache invalidated
  const patient = await Patient.findOne({});
  if (!patient) throw new Error("No Patient found in DB");

  const dateKey = getSlotDateKey(testDate);
  const employeeId = "all";

  await slotCacheService.setCachedSlots({
    date: testDate,
    serviceId: service._id.toString(),
    employeeId,
    slots: slotsBefore,
  });

  const cachedBefore = await slotCacheService.getCachedSlots({
    date: testDate,
    serviceId: service._id.toString(),
    employeeId,
  });

  const cachedHasFirst = cachedBefore?.some((s) => s.slotStart === firstSlot.slotStart);
  if (!cachedHasFirst) throw new Error("Precondition failed: chosen slot not found in cached data");

  const holdResponse = await reservationService.holdSeat({
    accountId: patient.account,
    shiftId: firstSlot.shiftId,
    dateInput: testDate,
    serviceId: service._id.toString(),
    slotStart: firstSlot.slotStart,
    slotEnd: firstSlot.slotEnd,
  });

  const reservationId = holdResponse.reservationId;

  // cache should be invalidated by holdSeat()
  const cachedAfterHold = await slotCacheService.getCachedSlots({
    date: testDate,
    serviceId: service._id.toString(),
    employeeId,
  });

  if (cachedAfterHold) {
    const stillThere = cachedAfterHold.some((s) => s.slotStart === firstSlot.slotStart);
    if (stillThere) throw new Error("Cache invalidation failed: slot still present in cache after hold");
  }

  const slotsAfterHold = await generateAvailableSlots({
    date: testDate,
    serviceId: service._id.toString(),
    shiftId: shift._id.toString(),
  });

  const slotPresentAfterHold = slotsAfterHold.some((s) => s.slotStart === firstSlot.slotStart);
  if (slotPresentAfterHold) throw new Error("Hold failed: slot still appears after holding");
  console.log("[e2eSlotEngineSmokeTest] Hold + cache invalidation check: PASS");

  // 4) Cancel -> slot should reappear
  const reservationDoc = await AppointmentReservation.findById(reservationId);
  if (!reservationDoc) throw new Error("Reservation created by holdSeat not found");

  reservationDoc.status = "cancelled";
  await reservationDoc.save();

  await releaseHold(firstSlot.shiftId, testDate, String(reservationId), firstSlot.slotStart);

  await slotCacheService.invalidateSlotCacheByDateKey({ dateKey });

  const slotsAfterCancel = await generateAvailableSlots({
    date: testDate,
    serviceId: service._id.toString(),
    shiftId: shift._id.toString(),
  });

  const slotPresentAfterCancel = slotsAfterCancel.some((s) => s.slotStart === firstSlot.slotStart);
  if (!slotPresentAfterCancel) {
    throw new Error("Cancel failed: slot does not reappear after releaseHold+cancel");
  }

  console.log("[e2eSlotEngineSmokeTest] Cancel frees slot check: PASS");
}

main()
  .then(() => {
    console.log("[e2eSlotEngineSmokeTest] ALL PASS");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[e2eSlotEngineSmokeTest] FAILED:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

