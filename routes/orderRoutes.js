const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const Router = express.Router();
Router.use(
  authMiddleware.isAuthorized,
  rbacMiddleware.isPermission(["admin", "user"])
);
Router.route("/getOrderByUser").get(orderController.getOrderByUser);
Router.route("/getRevenueByPeriod/:period").get(
  rbacMiddleware.isPermission(["admin"]),
  orderController.getRevenueByPeriod
);
Router.route("/").get(orderController.getAllOrders);
Router.route("/:id").get(orderController.getOrderByID);

Router.route("/").post(orderController.createOrder);
Router.route("/:id")
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);

module.exports = Router;
