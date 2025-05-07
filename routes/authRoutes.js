const express = require("express");
const authController = require("./../controllers/authController");
const authMiddleware = require("./../middlewares/authMiddleware");
const { api } = require("../providers/CloudinaryProvider");

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
Router.put("/verify2FA", authMiddleware.isAuthorized, authController.verify2FA);
Router.post("/loginGoogle", authController.loginGoogle);
Router.post("/loginFacebook", authController.loginFacebook);
Router.post("/send_recovery_email", authController.sendRecoveryEmail);
Router.post("/reset_password", authController.resetPassword);
module.exports = Router;
