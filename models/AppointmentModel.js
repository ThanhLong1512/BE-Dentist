const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: [true, "Please provide a valid patient"]
  },
  Date: {
    type: Date,
    required: [true, "Please provide examination date"]
  },
  Time: {
    type: String,
    required: [true, "Please provide a specifically time"]
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: [true, "Please provide a valid service"]
  }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
