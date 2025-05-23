const express = require("express");
const appointmentController = require("../controllers/appointmentController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const Router = express.Router();

Router.use(authMiddleware.isAuthorized);

Router.route("/getMyAppointment").get(
  rbacMiddleware.isPermission(["admin", "user"]),
  appointmentController.getAppointmentByUser
);

Router.route("/")
  .get(
    rbacMiddleware.isPermission(["admin", "user"]),
    appointmentController.getAllAppointments
  )
  .post(
    rbacMiddleware.isPermission("user"),
    appointmentController.createAppointment
  );
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
