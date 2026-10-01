const express = require("express");
const employeeController = require("../controllers/employeeController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const router = express.Router({ mergeParams: true });

// Public routes for viewing doctors / employees
router.route("/").get(employeeController.getAllEmployees);
router.route("/:id").get(employeeController.getEmployee);

// Admin-protected routes for managing employees
router.use(authMiddleware.isAuthorized, rbacMiddleware.isPermission(["admin"]));

router.route("/").post(
  employeeController.setServiceID,
  employeeController.createEmployee
);

router
  .route("/:id")
  .post(employeeController.duplicateEmployee)
  .patch(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

module.exports = router;
