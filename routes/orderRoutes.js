const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const Router = express.Router();
Router.use(
  authMiddleware.isAuthorized,
  rbacMiddleware.isPermission(["admin", "user"])
);
Router.route("/").get(orderController.getAllOrders);
Router.route("/:id").get(orderController.getOrderByID);

Router.route("/").post(orderController.createOrder);
Router.route("/:id")
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);
Router.route("/getOrderByUser", orderController.getOrderByUser);

module.exports = Router;
