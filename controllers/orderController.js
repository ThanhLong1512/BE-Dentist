const { StatusCodes } = require("http-status-codes");
const CatchAsync = require("../utils/catchAsync");
const Order = require("../models/OrderModel");
const Account = require("../models/AccountModel");
const Service = require("../models/ServicesModel");

const getOrders = CatchAsync(async (req, res) => {
  const orders = await Order.find()
    .populate("account")
    .populate("service");
  return res.status(StatusCodes.ACCEPTED).json({
    status: "success",
    data: orders
  });
});
const getOrder = CatchAsync(async (req, res) => {
  const userID = req.user.id;
  const order = Order.findById(req.user.id);
  if (!userID) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Please Login to check your order"
    });
  }
  if (!order) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No one order for this account" });
  }
  return res.status(StatusCodes.OK).json({
    status: "Successful",
    data: {
      order
    }
  });
});
const OrderController = { getOrders, getOrder };
module.exports = OrderController;
