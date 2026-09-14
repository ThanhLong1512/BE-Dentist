const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "config.env") });

const Setting = require("../models/SettingModel");

const initialSettings = {
  clinicName: "Nha Khoa Smile Care",
  slogan: "Nụ cười rạng rỡ - Tự tin tỏa sáng",
  hotline: "1900 6868",
  supportEmail: "support@smilecare.vn",
  headquarterAddress: "120 Hai Bà Trưng, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh",
  licenseNumber: "GP-0892/SYT-GPHĐ",
  openHours: "08:00 - 20:00 (Thứ 2 - CN)",

  holdSeatTtlSeconds: 300,
  bufferMinutes: 10,
  maxAdvanceBookingDays: 30,
  minHoursBeforeCancel: 24,

  depositPercentage: 20,
  vatPercentage: 8,
  enableOnlinePayment: true,
  enableCashPayment: true,

  emailNotificationEnabled: true,
  appointmentReminderHours: 24,
  adminSoundAlerts: true
};

const seedSettings = async () => {
  try {
    const dbUrl = process.env.DATABASE || "mongodb://127.0.0.1:27017/dentist?directConnection=true";
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB for seeding settings...");

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(initialSettings);
      console.log("Successfully created default system settings!");
    } else {
      console.log("Settings already exist, preserving current configuration.");
    }

    console.log("Current System Settings:", {
      clinicName: settings.clinicName,
      hotline: settings.hotline,
      holdSeatTtlSeconds: settings.holdSeatTtlSeconds,
      depositPercentage: settings.depositPercentage
    });

    await mongoose.disconnect();
    console.log("Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding settings:", error);
    process.exit(1);
  }
};

seedSettings();
