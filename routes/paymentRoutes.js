const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("./../middlewares/authMiddleware");

const Router = express.Router();
Router.post(
  "/paymentWithMoMo",
  authMiddleware.isAuthorized,
  paymentController.paymentWithMoMo
);
Router.post(
  "/paymentWithZaloPay",
  authMiddleware.isAuthorized,
  paymentController.paymentWithZaloPay
);
Router.post(
  "/paymentWithVnPay",
  authMiddleware.isAuthorized,
  paymentController.paymentWithVnPay
);
Router.post("/callbackwithZaloPay", paymentController.callbackZaloPay);
Router.post("/callbackwithMoMo", paymentController.callbackMoMo);
Router.post("/callbackwithVNPay", paymentController.callbackVnPay);
module.exports = Router;
