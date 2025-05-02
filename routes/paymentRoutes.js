const express = require("express");
const paymentController = require("../controllers/paymentController");

const Router = express.Router();
Router.post("/paymentWithMoMo", paymentController.paymentWithMoMo);
Router.get("/paymentWithZaloPay", paymentController.paymentWithZaloPay);
Router.post("/paymentWithVnPay", paymentController.paymentWithVnPay);
module.exports = Router;
