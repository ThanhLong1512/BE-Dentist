const express = require("express");
const OrderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

const Router = express.Router();
// Router.use(authMiddleware.isAuthorized);
Router.get("/", OrderController.getOrders);
Router.get("/getOrderByUser", OrderController.getOrder);

module.exports = Router;
