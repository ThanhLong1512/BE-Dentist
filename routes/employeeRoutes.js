const express = require("express");
const employeeController = require("../controllers/EmployeeController");

const Router = express.Router();

Router.get("/", employeeController.getEmployees);
Router.post("/", employeeController.createEmployee);
Router.get("/:id", employeeController.getEmployeeById);
Router.put("/:id", employeeController.updateEmployee);
Router.delete("/:id", employeeController.deleteEmployee);

module.exports = Router;
