const Review = require("./../models/ReviewModel");
const factory = require("./handlerFactory");
// const catchAsync = require('./../utils/catchAsync');

exports.setServiceUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.service) req.body.service = req.params.serviceId;
  if (!req.body.account) req.body.account = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
