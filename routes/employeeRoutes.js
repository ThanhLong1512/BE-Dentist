const express = require("express");
const employeeController = require("../controllers/EmployeeController");

const Router = express.Router();

Router.route("/")
  .get(employeeController.getEmployees)
  .post(employeeController.createEmployee);
Router.route("/:id")
  .get(employeeController.getEmployeeById)
  .put(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

module.exports = Router;
