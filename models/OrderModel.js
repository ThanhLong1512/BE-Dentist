const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Please provide a valid patient"]
    },
    service: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: [true, "Please provide a valid service"]
      }
    ],
    createAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["successful", "cancelled"],
      required: [true, "Please provide the order status"]
    },
    totalPrice: {
      type: Number,
      required: [true, "Please provide the total price"]
    },
    paymentMethod: {
      type: String,
      required: [true, "Please provide the payment method"]
    }
  },
  {
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
