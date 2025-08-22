const Review = require("./../models/ReviewModel");
const factory = require("./handlerFactory");
const catchAsync = require("./../utils/catchAsync");

exports.setServiceUserIds = (req, res, next) => {
  if (!req.body.service) req.body.service = req.params.serviceId;
  if (!req.body.account) req.body.account = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

exports.getReviewStatsByPeriod = catchAsync(async (req, res, next) => {
  const { period } = req.params;

  const validPeriods = [7, 30, 90];
  const periodNumber = parseInt(period);

  if (!validPeriods.includes(periodNumber)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid period. Please use 7, 30, or 90 days"
    });
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - periodNumber);

  // Lấy tất cả reviews trong khoảng thời gian
  const reviews = await Review.find({
    createdAt: {
      // Thay bằng createAt nếu field name khác
      $gte: startDate,
      $lte: endDate
    }
  })
    .populate("service", "nameService")
    .populate("account", "name email");

  if (!reviews || reviews.length === 0) {
    return res.status(200).json({
      status: "success",
      message: `No reviews found in the last ${periodNumber} days`
    });
  }

  const totalReviews = reviews.length;

  const totalRating = reviews.reduce(
    (sum, review) => sum + (review.rating || 0),
    0
  );
  const averageRating = totalRating / totalReviews;

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach(review => {
    const rating = Math.round(review.rating || 0);
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating]++;
    }
  });

  const ratingDistribution = {};
  for (let i = 1; i <= 5; i++) {
    ratingDistribution[i] = {
      count: ratingCounts[i],
      percentage: Math.round((ratingCounts[i] / totalReviews) * 100 * 100) / 100
    };
  }

  return res.status(200).json({
    status: "success",
    data: {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100
    }
  });
});
