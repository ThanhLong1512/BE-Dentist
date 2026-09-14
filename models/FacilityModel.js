const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên cơ sở phòng khám"],
      trim: true
    },
    code: {
      type: String,
      required: [true, "Vui lòng nhập mã cơ sở"],
      unique: true,
      trim: true,
      uppercase: true
    },
    address: {
      type: String,
      required: [true, "Vui lòng nhập địa chỉ cơ sở"],
      trim: true
    },
    city: {
      type: String,
      required: [true, "Vui lòng nhập tỉnh/thành phố"],
      trim: true,
      default: "TP. Hồ Chí Minh"
    },
    phoneNumber: {
      type: String,
      required: [true, "Vui lòng nhập số điện thoại hotline"],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    workingHours: {
      type: String,
      default: "08:00 - 20:00 (Thứ 2 - CN)",
      trim: true
    },
    chairCount: {
      type: Number,
      default: 6,
      min: [1, "Số ghế nha khoa phải lớn hơn hoặc bằng 1"]
    },
    managerName: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ["active", "maintenance", "inactive"],
        message: "Trạng thái không hợp lệ"
      },
      default: "active"
    },
    image: {
      type: String,
      default: "/images/resource/facility-1.jpg"
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

facilitySchema.index({ city: 1, status: 1 });

const Facility = mongoose.model("Facility", facilitySchema);

module.exports = Facility;
