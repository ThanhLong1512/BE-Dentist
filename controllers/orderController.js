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
  const list = orders || [];

  const codOrders = list.filter(order => order.paymentMethod === "COD");
  const paidOrders = list.filter(order => order.paymentMethod !== "COD");

  return res.status(StatusCodes.OK).json({
    status: "Successful",
    data: {
      codOrders,
      paidOrders
    }
  });
});
exports.getRevenueByPeriod = CatchAsync(async (req, res, next) => {
  const { period } = req.params;

  const validPeriods = [7, 30, 90];
  const periodNumber = parseInt(period);

  if (!validPeriods.includes(periodNumber)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "error",
      message: "Invalid period. Please use 7, 30, or 90 days"
    });
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - periodNumber);

  const orders = await Order.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  });
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.totalPrice || 0),
    0
  );

  return res.status(StatusCodes.OK).json({
    status: "success",
    data: {
      totalRevenue,
      orders
    }
  });
});
