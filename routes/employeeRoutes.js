const express = require("express");
const router = express.Router();
const EmployeeController = require("../controllers/EmployeeController");

router.get("/", EmployeeController.getEmployees);
router.post("/", EmployeeController.createEmployee);
router.get("/:id", EmployeeController.getEmployeeById);
router.put("/:id", EmployeeController.updateEmployee);
router.delete("/:id", EmployeeController.deleteEmployee);

// 🚀 Quan trọng: Export router
module.exports = router;
