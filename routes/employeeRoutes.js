const express = require("express");
const employeeController = require("../controllers/employeeController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware.isAuthorized);

router
  .route("/")
  .get(employeeController.getAllEmployees)
  .post(
    rbacMiddleware.isPermission(["admin"]),
    employeeController.setServiceID,
    employeeController.createEmployee
  );

router
  .route("/:id")
  .get(employeeController.getEmployee)
  .patch(
    rbacMiddleware.isPermission(["admin"]),
    employeeController.updateEmployee
  )
  .delete(
    rbacMiddleware.isPermission(["admin"]),
    employeeController.deleteEmployee
  );

module.exports = router;
