const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  employee: {
    type: String,
    ref: "Employee",
    required: [true, "Please provide the employee code"]
  },
  DayOfWeek: {
    type: String,
    required: [true, "Please provide the day of the week"],
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ]
  },
  StartTime: {
    type: String,
    required: [true, "Please provide the start time"]
  },
  EndTime: {
    type: String,
    required: [true, "Please provide the end time"]
  }
});

const Shift = mongoose.model("Shift", shiftSchema);
module.exports = Shift;
