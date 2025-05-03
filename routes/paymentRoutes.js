const express = require("express");
const paymentController = require("../controllers/paymentController");

const Router = express.Router();
Router.post("/paymentWithMoMo", paymentController.paymentWithMoMo);
Router.post("/paymentWithZaloPay", paymentController.paymentWithZaloPay);
Router.post("/paymentWithVnPay", paymentController.paymentWithVnPay);
Router.post("/callbackwithZaloPay", paymentController.callbackZaloPay);
Router.post("/callbackwithMoMo", paymentController.callbackMoMo);
Router.post("/callbackwithVNPay", paymentController.callbackVnPay);
module.exports = Router;
