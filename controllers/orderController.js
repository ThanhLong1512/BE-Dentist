const { StatusCodes } = require("http-status-codes");
const CatchAsync = require("../utils/catchAsync");
const Order = require("../models/OrderModel");
const factory = require("./handlerFactory");

exports.getAllOrders = factory.getAll(Order);
exports.getOrderByID = factory.getOne(Order);
exports.createOrder = factory.createOne(Order);
exports.updateOrder = factory.updateOne(Order);
exports.deleteOrder = factory.deleteOne(Order);

exports.getOrderByUser = CatchAsync(async (req, res) => {
  const userID = req.user.id;

  if (!userID) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Please Login to check your order"
    });
  }

  const orders = await Order.find({ account: userID }).populate("service");

  if (!orders || orders.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "No orders found for this account"
    });
  }

  const codOrders = orders.filter(order => order.paymentMethod === "COD");

  const paidOrders = orders.filter(order => order.paymentMethod !== "COD");

  return res.status(StatusCodes.OK).json({
    status: "Successful",
    data: {
      codOrders,
      paidOrders
    }
  });
});
