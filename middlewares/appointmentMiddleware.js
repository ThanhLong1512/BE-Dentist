exports.populatePatientAndShift = function(next) {
  this.populate({ path: "patient" }).populate({
    path: "shift",
    populate: {
      path: "employee",
      populate: {
        path: "service"
      }
    }
  });
  next();
};
