const mongoose = require("mongoose");
const {
  populatePatientAndShift
} = require("../middlewares/appointmentMiddleware");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Please provide a valid patient"]
    },
    Date: {
      type: Date,
      required: [true, "Please provide examination date"]
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: [true, "Please provide a valid shift"]
    },
    // Slot con (theo doan thoi gian) trong mot shift ngay.
    // De backward-compat, cac truong nay khong required ngay lap tuc.
    slotStart: {
      type: String, // "HH:mm"
      default: null
    },
    slotEnd: {
      type: String, // "HH:mm"
      default: null
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null
    },
    durationMinutes: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "checked_in",
        "in_progress",
        "completed",
        "cancelled",
        "rescheduled"
      ],
      default: "scheduled"
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
        note: String
      }
    ],
    remindersSent: {
      "1day": Date,
      "2hours": Date
    }
  },
  {
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);
// Luc nay cho phep nhieu appointment/shift ngay (moi slotStart la mot bookable unit).
appointmentSchema.index({ shift: 1, Date: 1, slotStart: 1 }, { unique: true });
appointmentSchema.pre(/^find/, populatePatientAndShift);

// Backward-compat: neu appointment tao len ma chua co slotStart/slotEnd/service/durationMinutes
// thi fallback theo thong tin shift (StartTime/EndTime) va service cua employee trong shift.
appointmentSchema.pre("validate", async function(next) {
  try {
    const needsFill =
      !this.slotStart || !this.slotEnd || !this.service || !this.durationMinutes;
    if (!needsFill) return next();

    const Shift = require("./ShiftModel");
    const shiftDoc = await Shift.findById(this.shift).populate({
      path: "employee",
      populate: { path: "service" }
    });

    if (!shiftDoc) return next();

    if (!this.slotStart) this.slotStart = shiftDoc.StartTime;
    if (!this.slotEnd) this.slotEnd = shiftDoc.EndTime;

    const svc = shiftDoc.employee?.service;
    if (svc && !this.service) this.service = svc._id;
    if (svc && !this.durationMinutes) this.durationMinutes = svc.durationMinutes;

    return next();
  } catch (err) {
    return next(err);
  }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
