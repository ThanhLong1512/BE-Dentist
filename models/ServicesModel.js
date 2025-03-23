const mongoose = require("mongoose");

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
    type: String,
    default: "default.jpg"
  },
  description: {
    type: String
  }
});
const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
