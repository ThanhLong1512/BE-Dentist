const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("./../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const {
  appointmentPaymentBody,
  codPaymentBody
} = require("../validations/paymentValidation");

const Router = express.Router();
Router.post(
  "/paymentWithCOD",
  authMiddleware.isAuthorized,
  validate({ body: codPaymentBody }),
  paymentController.paymentWithCOD
);
Router.post(
  "/paymentWithMoMo",
  authMiddleware.isAuthorized,
  validate({ body: appointmentPaymentBody }),
  paymentController.paymentWithMoMo
);
Router.post(
  "/paymentWithZaloPay",
  authMiddleware.isAuthorized,
  validate({ body: appointmentPaymentBody }),
  paymentController.paymentWithZaloPay
);
Router.post(
  "/paymentWithVnPay",
  authMiddleware.isAuthorized,
  validate({ body: appointmentPaymentBody }),
  paymentController.paymentWithVnPay
);
Router.post("/callbackwithZaloPay", paymentController.callbackZaloPay);
Router.post("/callbackwithMoMo", paymentController.callbackMoMo);
Router.post("/callbackwithVNPay", paymentController.callbackVnPay);
module.exports = Router;
