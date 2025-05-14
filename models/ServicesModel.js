const mongoose = require("mongoose");
const { trim } = require("validator");

const serviceSchema = mongoose.Schema({
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
    require: [true, "A service must have a summary"],
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
    type: Number,
    validate: {
      validator: function(val) {
        return val < this.priceService;
      },
      message: "Discount price ({VALUE}) should be below regular price"
    }
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
});
const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
