const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    // General Clinic Information
    clinicName: {
      type: String,
      default: "Nha Khoa Smile Care",
      trim: true
    },
    slogan: {
      type: String,
      default: "Nụ cười rạng rỡ - Tự tin tỏa sáng",
      trim: true
    },
    hotline: {
      type: String,
      default: "1900 6868",
      trim: true
    },
    supportEmail: {
      type: String,
      default: "support@smilecare.vn",
      trim: true,
      lowercase: true
    },
    headquarterAddress: {
      type: String,
      default: "120 Hai Bà Trưng, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh",
      trim: true
    },
    licenseNumber: {
      type: String,
      default: "GP-0892/SYT-GPHĐ",
      trim: true
    },
    openHours: {
      type: String,
      default: "08:00 - 20:00 (Thứ 2 - CN)",
      trim: true
    },

    // Booking Policies
    holdSeatTtlSeconds: {
      type: Number,
      default: 300,
      min: [60, "Thời gian giữ chỗ tối thiểu là 60 giây"]
    },
    bufferMinutes: {
      type: Number,
      default: 10,
      min: [0, "Thời gian đệm không được âm"]
    },
    maxAdvanceBookingDays: {
      type: Number,
      default: 30,
      min: [1, "Số ngày đặt trước tối thiểu là 1 ngày"]
    },
    minHoursBeforeCancel: {
      type: Number,
      default: 24,
      min: [0, "Thời gian hủy tối thiểu không được âm"]
    },

    // Finance & Payment
    depositPercentage: {
      type: Number,
      default: 20,
      min: [0, "Tỷ lệ cọc không được nhỏ hơn 0%"],
      max: [100, "Tỷ lệ cọc không được vượt quá 100%"]
    },
    vatPercentage: {
      type: Number,
      default: 8,
      min: [0, "Thuế VAT không được âm"],
      max: [30, "Thuế VAT tối đa 30%"]
    },
    enableOnlinePayment: {
      type: Boolean,
      default: true
    },
    enableCashPayment: {
      type: Boolean,
      default: true
    },

    // Notifications & Automation
    emailNotificationEnabled: {
      type: Boolean,
      default: true
    },
    appointmentReminderHours: {
      type: Number,
      default: 24,
      min: [1, "Giờ nhắc hẹn tối thiểu là 1 giờ"]
    },
    adminSoundAlerts: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Setting = mongoose.model("Setting", settingSchema);

module.exports = Setting;
