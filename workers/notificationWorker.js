const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connection } = require("../queues/notificationQueue");
require("../models/PatientModel");
require("../models/AccountModel");
require("../models/ShiftModel");
require("../models/EmployeeModel");
require("../models/ServicesModel");
require("../models/ReviewModel");
const Appointment = require("../models/AppointmentModel");
const { sendEmail } = require("../providers/emailProvider");
const { sendSMS } = require("../providers/smsProvider");
const { emitNotification } = require("../providers/socketProvider");

dotenv.config({ path: "./config.env" });

const buildReminderMessage = (type, data) => {
  if (type === "1day") {
    return "Xin chao " + data.patientName + ", ban co lich kham vao " + data.dateText + " (" + data.timeText + ") voi bac si " + data.doctorName + ".";
  }
  return "Nhac nhanh: " + data.patientName + " co lich kham luc " + data.timeText + " voi bac si " + data.doctorName + ".";
};

const processReminder = async (appointmentId, reminderType) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment || ["cancelled", "completed"].includes(appointment.status)) return;

  await appointment.populate([
    { path: "patient", populate: { path: "account" } },
    { path: "shift", populate: { path: "employee" } }
  ]);

  const patient = appointment.patient;
  const shift = appointment.shift;
  const account = patient && patient.account;
  const dateText = new Date(appointment.Date).toLocaleDateString("vi-VN");
  const timeText = (shift && shift.StartTime || "") + " - " + (shift && shift.EndTime || "");
  const doctorName = (shift && shift.employee && shift.employee.name) || "bac si";
  const patientName = (patient && patient.name) || "Quy khach";
  const message = buildReminderMessage(reminderType, { patientName, doctorName, dateText, timeText });
  const subject = reminderType === "1day" ? "Nhac lich kham - 1 ngay nua" : "Nhac lich kham - con 2 tieng";

  if (account && account.email) {
    await sendEmail({ to: account.email, subject, html: "<p>" + message + "</p>", text: message });
  }
  if (patient && patient.phoneNumber) {
    await sendSMS({ to: patient.phoneNumber, message });
  }

  emitNotification({
    userId: account && account._id ? account._id.toString() : undefined,
    title: subject,
    message,
    type: "reminder_" + reminderType,
    appointmentId: appointment._id.toString()
  });

  appointment.remindersSent = appointment.remindersSent || {};
  appointment.remindersSent[reminderType] = new Date();
  await appointment.save();
};

let worker = null;

const startNotificationWorker = async () => {
  if (worker) return worker;

  if (mongoose.connection.readyState === 0) {
    const DB_URI = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
    await mongoose.connect(DB_URI);
  }

  worker = new Worker(
    "appointment-notifications",
    async job => {
      if (job.name === "appointment-reminder") {
        await processReminder(job.data.appointmentId, job.data.reminderType);
      }

      if (job.name === "schedule-change-notify") {
        const { appointmentId, reason } = job.data;
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return;

        await appointment.populate([
          { path: "patient", populate: { path: "account" } },
          { path: "shift", populate: { path: "employee" } }
        ]);

        const account = appointment.patient && appointment.patient.account;
        const message = reason || "Lich kham cua ban da duoc cap nhat.";

        if (account && account.email) {
          await sendEmail({
            to: account.email,
            subject: "Thong bao thay doi lich kham",
            html: "<p>" + message + "</p>",
            text: message
          });
        }

        if (appointment.patient && appointment.patient.phoneNumber) {
          await sendSMS({ to: appointment.patient.phoneNumber, message });
        }

        emitNotification({
          userId: account && account._id ? account._id.toString() : undefined,
          title: "Lich kham thay doi",
          message,
          type: "schedule_changed",
          appointmentId: appointment._id.toString()
        });
      }
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error("Notification job failed:", err.message);
  });

  console.log("Notification worker started");
  return worker;
};

module.exports = { startNotificationWorker };
