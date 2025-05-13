const express = require("express");
const employeeController = require("../controllers/EmployeeController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const Router = express.Router();
Router.use(authMiddleware.isAuthorized, rbacMiddleware.isPermission(["admin"])); // Apply authentication middleware to all routes
Router.route("/")
  .get(employeeController.getEmployees)
  .post(employeeController.createEmployee);
Router.route("/:id")
  .get(employeeController.getEmployeeById)
  .put(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

module.exports = Router;
