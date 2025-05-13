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
  shift: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shift",
    required: [true, "Please provide a valid shift"]
  }],
},{
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
