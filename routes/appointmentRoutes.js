const express = require("express");
const appointmentController = require("../controllers/appointmentController");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const Router = express.Router();

// Middleware to check if the user is authenticated for all routes
Router.use(authMiddleware.isAuthorized);

Router.route("/")
  .get(
    rbacMiddleware.isPermission(["admin", "user"]),
    appointmentController.getAppointments
  )
  .post(
    rbacMiddleware.isPermission("user"),
    appointmentController.createAppointment
  );
// Middleware to allow accessed routes for admin and user roles
// Router.use(authController.restrictTo("admin", "user"));

Router.route("/:id")
  .get(
    rbacMiddleware.isPermission(["admin", "user"]),
    appointmentController.getAppointment
  )
  .patch(
    rbacMiddleware.isPermission(["user"]),
    appointmentController.updateAppointment
  )
  .delete(
    rbacMiddleware.isPermission(["user"]),
    appointmentController.deleteAppointment
  );

module.exports = Router;
