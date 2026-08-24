const mongoose = require("mongoose");
const { notificationQueue } = require("../queues/notificationQueue");
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const parseShiftStart = (appointmentDate, startTime) => {
  const date = new Date(appointmentDate);
  const parts = (startTime || "09:00").split(":");
  date.setHours(Number(parts[0]) || 9, Number(parts[1]) || 0, 0, 0);
  return date;
};

const cancelAppointmentReminders = async appointmentId => {
  const jobIds = [appointmentId + "-1day", appointmentId + "-2hours"];
  for (const jobId of jobIds) {
    try {
      const job = await notificationQueue.getJob(jobId);
      if (job) await job.remove();
    } catch (error) {}
  }
};

const scheduleAppointmentReminders = async appointmentId => {
  const apptId = new mongoose.Types.ObjectId(String(appointmentId));
  const appointment = await mongoose.connection.db
    .collection("appointments")
    .findOne({ _id: apptId }, { projection: { Date: 1, shift: 1, status: 1 } });
  if (!appointment) return;

  const shift = await mongoose.connection.db
    .collection("shifts")
    .findOne({ _id: appointment.shift }, { projection: { StartTime: 1, EndTime: 1 } });
  if (!shift) return;

  await cancelAppointmentReminders(appointmentId);

  const appointmentDateTime = parseShiftStart(appointment.Date, shift.StartTime);
  const now = Date.now();
  const reminders = [
    { type: "1day", offsetMs: ONE_DAY_MS, jobId: appointmentId + "-1day" },
    { type: "2hours", offsetMs: TWO_HOURS_MS, jobId: appointmentId + "-2hours" }
  ];

  for (const reminder of reminders) {
    const delay = appointmentDateTime.getTime() - reminder.offsetMs - now;
    if (delay <= 0) continue;
    await notificationQueue.add(
      "appointment-reminder",
      { appointmentId: appointmentId.toString(), reminderType: reminder.type },
      { delay, jobId: reminder.jobId }
    );
  }
};

const queueScheduleChangeNotification = async (appointmentId, reason) => {
  await notificationQueue.add(
    "schedule-change-notify",
    { appointmentId: appointmentId.toString(), reason },
    { jobId: "schedule-change-" + appointmentId + "-" + Date.now() }
  );
};

module.exports = {
  scheduleAppointmentReminders,
  cancelAppointmentReminders,
  queueScheduleChangeNotification,
  parseShiftStart
};
