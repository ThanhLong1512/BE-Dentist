const express = require("express");
const authController = require("./../controllers/authController");

const Router = express.Router();

Router.post("/login", authController.login);
Router.delete("/logout", authController.logout);
Router.put("/refreshToken", authController.refreshToken);
module.exports = Router;
