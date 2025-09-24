exports.getShiftsByToday = function(req, res, next) {
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
  req.dayOfWeekFilter = currentDayOfWeek;

  next();
};

exports.filterBookedShift = function(next) {
  this.find({ isBooked: { $ne: true } });
  next();
};

exports.populateEmployeeAndService = function(next) {
  this.populate({
    path: "employee",
    populate: {
      path: "service",
      model: "Service"
    }
  });
  next();
};
