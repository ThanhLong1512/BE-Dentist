const express = require("express");
const authController = require("./../controllers/authController");
const authMiddleware = require("./../middlewares/authMiddleware");

const Router = express.Router();

Router.post("/login", authController.login);
Router.delete("/logout", authMiddleware.isAuthorized, authController.logout);
Router.put(
  "/refreshToken",
  authMiddleware.isAuthorized,
  authController.refreshToken
);
Router.post("/register", authController.register);
Router.get(
  "/get_2fa_qr_code",
  authMiddleware.isAuthorized,
  authController.get2FA_QRCode
);
Router.post("/setUp2FA", authMiddleware.isAuthorized, authController.setUp2FA);
module.exports = Router;
