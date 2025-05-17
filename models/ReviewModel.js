const mongoose = require("mongoose");
const Service = require("./ServicesModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: "Service",
      required: [true, "Review must belong to a service."]
    },
    account: {
      type: mongoose.Schema.ObjectId,
      ref: "Account",
      required: [true, "Review must belong to a account"]
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ account: 1, service: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: "account",
    select: "name email photo"
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(serviceId) {
  const stats = await this.aggregate([
    {
      $match: { service: serviceId }
    },
    {
      $group: {
        _id: "$service",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" }
      }
    }
  ]);

  if (stats.length > 0) {
    await Service.findByIdAndUpdate(serviceId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Service.findByIdAndUpdate(serviceId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post("save", function() {
  this.constructor.calcAverageRatings(this.service);
});

reviewSchema.pre("findOneAndDelete", async function(next) {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    this._serviceId = doc.service;
  }
  next();
});

reviewSchema.post("findOneAndDelete", async function() {
  if (this._serviceId) {
    await this.model.calcAverageRatings(this._serviceId);
  }
});

reviewSchema.pre("findOneAndUpdate", async function(next) {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    this._serviceId = doc.service;
  }
  next();
});

reviewSchema.post("findOneAndUpdate", async function() {
  if (this._serviceId) {
    await this.model.calcAverageRatings(this._serviceId);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
