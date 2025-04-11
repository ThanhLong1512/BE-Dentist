const getShiftsByToday = (req, res, next) => {
  try {
    const today = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];
    const currentDayOfWeek = days[today.getDay()];

    console.log("Current day of week:", currentDayOfWeek);

    // Add day of week filter to request
    req.dayOfWeekFilter = currentDayOfWeek;

    next();
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error filtering shifts by day of week",
        error: error.message
      });
  }
};

function filterBookedShift(next) {
  this.find({ isBooked: { $ne: true } });
  next();
}
module.exports = {
  getShiftsByToday,
  filterBookedShift
};
