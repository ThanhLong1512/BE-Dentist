const mongoose = require("mongoose");
const {
  getShiftsByToday,
  filterBookedShift
} = require("../middlewares/shiftMiddleware");
const shiftSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: [true, "Please provide the employee"]
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
  },
  isBooked: {
    type: Boolean,
    default: false
  }
});
shiftSchema.pre(/^find/, filterBookedShift);
const Shift = mongoose.model("Shift", shiftSchema);
module.exports = Shift;
