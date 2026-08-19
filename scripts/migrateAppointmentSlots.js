const dotenv = require("dotenv");

dotenv.config({ path: "../config.env" });

const mongoose = require("mongoose");
const Appointment = require("../models/AppointmentModel");
const AppointmentReservation = require("../models/AppointmentReservationModel");
const Shift = require("../models/ShiftModel");

const DB_URI = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

async function migrateAppointments() {
  const query = {
    $or: [
      { slotStart: { $in: [null, undefined, ""] } },
      { slotEnd: { $in: [null, undefined, ""] } },
      { service: { $in: [null, undefined, ""] } },
      { durationMinutes: { $in: [null, undefined] } }
    ]
  };

  const toUpdate = await Appointment.find(query).limit(1000);
  console.log(`[migrateAppointmentSlots] Appointment toUpdate=${toUpdate.length}`);

  for (const appt of toUpdate) {
    const shiftDoc = await Shift.findById(appt.shift).populate({
      path: "employee",
      populate: { path: "service" }
    });

    if (!shiftDoc) continue;

    if (!appt.slotStart) appt.slotStart = shiftDoc.StartTime;
    if (!appt.slotEnd) appt.slotEnd = shiftDoc.EndTime;

    const svc = shiftDoc.employee?.service;
    if (svc) {
      if (!appt.service) appt.service = svc._id;
      if (!appt.durationMinutes) appt.durationMinutes = svc.durationMinutes;
    }

    await appt.save();
    console.log(`- updated appointment ${appt._id}`);
  }
}

async function migrateReservations() {
  const query = {
    $or: [
      { slotStart: { $in: [null, undefined, ""] } },
      { slotEnd: { $in: [null, undefined, ""] } },
      { service: { $in: [null, undefined, ""] } },
      { durationMinutes: { $in: [null, undefined] } }
    ]
  };

  const toUpdate = await AppointmentReservation.find(query).limit(1000);
  console.log(`[migrateAppointmentSlots] Reservation toUpdate=${toUpdate.length}`);

  for (const rsv of toUpdate) {
    const shiftDoc = await Shift.findById(rsv.shift).populate({
      path: "employee",
      populate: { path: "service" }
    });

    if (!shiftDoc) continue;

    if (!rsv.slotStart) rsv.slotStart = shiftDoc.StartTime;
    if (!rsv.slotEnd) rsv.slotEnd = shiftDoc.EndTime;

    const svc = shiftDoc.employee?.service;
    if (svc) {
      if (!rsv.service) rsv.service = svc._id;
      if (!rsv.durationMinutes) rsv.durationMinutes = svc.durationMinutes;
    }

    await rsv.save();
    console.log(`- updated reservation ${rsv._id}`);
  }
}

async function main() {
  console.log(`[migrateAppointmentSlots] Connecting...`);
  await mongoose.connect(DB_URI);
  await migrateAppointments();
  await migrateReservations();
  console.log(`[migrateAppointmentSlots] Done`);
  await mongoose.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

