const mongoose = require("mongoose");

const appointmentReservationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Please provide a valid patient"]
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: [true, "Please provide a valid shift"]
    },
    Date: {
      type: Date,
      required: [true, "Please provide examination date"]
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "expired", "cancelled"],
      default: "pending"
    },
    expiresAt: {
      type: Date,
      required: true
    },
    paymentMethod: String,
    paymentRef: String,
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

appointmentReservationSchema.index({ shift: 1, Date: 1, status: 1 });
appointmentReservationSchema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model(
  "AppointmentReservation",
  appointmentReservationSchema
);
