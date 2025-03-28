const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const employeeController = require("../controllers/employeeController");

const Router = express.Router();

Router.get(
  "/getEmployees",
  authMiddleware.isAuthorized,
  employeeController.getEmployee
);
module.exports = Router;
