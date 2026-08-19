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
appointmentSchema.index({ shift: 1, Date: 1 }, { unique: true });
appointmentSchema.pre(/^find/, populatePatientAndShift);
const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
