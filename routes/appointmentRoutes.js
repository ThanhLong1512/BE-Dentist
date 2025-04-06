const express = require("express");
const appointmentController = require("../controllers/appointmentController");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const Router = express.Router();

// Middleware to check if the user is authenticated for all routes
Router.use(authMiddleware.isAuthorized);

Router.route("/")
  .get(appointmentController.getAppointments)
  .post(
    // authController.restrictTo("user"),
    appointmentController.createAppointment
  );
// Middleware to allow accessed routes for admin and user roles
// Router.use(authController.restrictTo("admin", "user"));

Router.route("/:id")
  .get(appointmentController.getAppointment)
  .put(appointmentController.updateAppointment)
  .delete(appointmentController.deleteAppointment);

module.exports = Router;
