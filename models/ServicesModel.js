const mongoose = require("mongoose");
const { trim } = require("validator");
const { populateReviews } = require("../middlewares/serviceMiddleware");

const serviceSchema = mongoose.Schema(
  {
    nameService: {
      type: String,
      required: [true, "Please provide the name service"]
    },
    Unit: {
      type: String,
      required: [true, "Please provide the unit of measurement"]
    },
    priceService: {
      type: Number,
      required: [true, "Please provide a valid price"]
    },
    // Thoi luong dich vu (phut) de tinh toan cac slot thoi gian.
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: [15, "durationMinutes must be >= 15"]
    },
    // Thoi gian don thiet bi/bu tru giua 2 ca dat lien tiep.
    // Mac dinh 10 phut theo yeu cau nghiep vu.
    bufferMinutes: {
      type: Number,
      default: 10
    },
    photoService: {
      public_id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    },
    summary: {
      type: String,
      required: [true, "A service must have a summary"],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    priceDiscount: {
      type: Number
      // validate: {
      //   validator: function(val) {
      //     return val < this.priceService;
      //   },
      //   message: "Discount price ({VALUE}) should be below regular price"
      // }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
serviceSchema.index({ nameService: 1 });
serviceSchema.index({ createdAt: -1 });
serviceSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "service",
  localField: "_id"
});

serviceSchema.pre(/^find/, populateReviews);

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
