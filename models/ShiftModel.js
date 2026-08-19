const mongoose = require("mongoose");
const {
  getShiftsByToday,
  filterBookedShift,
  populateEmployeeAndService
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
  ,
  // Cac khoang nghi (VD nghi trua) de tru khoi khoang lam viec khi sinh slot.
  breaks: [
    {
      startTime: {
        type: String,
        // "HH:mm"
      },
      endTime: {
        type: String,
        // "HH:mm"
      }
    }
  ],
  // Buoc chia luoi slot de hien thi (VD 15 phut / 10 phut)
  slotIntervalMinutes: {
    type: Number,
    default: 15,
    min: 5
  }
});
shiftSchema.pre(/^find/, filterBookedShift);
shiftSchema.pre(/^find/, populateEmployeeAndService);
const Shift = mongoose.model("Shift", shiftSchema);
module.exports = Shift;
