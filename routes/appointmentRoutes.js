const express = require("express");
const appointmentController = require("../controllers/appointmentController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const validate = require("../middlewares/validate");
const {
  holdAppointmentBody,
  createAppointmentBody,
  updateStatusBody,
  rescheduleBody,
  periodParams,
  reservationIdParams,
  idParams
} = require("../validations/appointmentValidation");

const Router = express.Router();

Router.use(authMiddleware.isAuthorized);

Router.route("/getMyAppointment").get(
  rbacMiddleware.isPermission(["admin", "user"]),
  appointmentController.getAppointmentByUser
);
Router.route("/getByPeriod/:period").get(
  rbacMiddleware.isPermission(["admin"]),
  validate({ params: periodParams }),
  appointmentController.getAppointmentByPeriod
);

Router.route("/hold").post(
  rbacMiddleware.isPermission(["user"]),
  validate({ body: holdAppointmentBody }),
  appointmentController.holdAppointment
);

Router.route("/reservations/:reservationId/cancel").delete(
  rbacMiddleware.isPermission(["user"]),
  validate({ params: reservationIdParams }),
  appointmentController.cancelReservation
);

Router.route("/")
  .get(
    rbacMiddleware.isPermission(["admin", "user"]),
    appointmentController.getAllAppointments
  )
  .post(
    rbacMiddleware.isPermission(["admin", "user"]),
    validate({ body: createAppointmentBody }),
    appointmentController.createAppointment
  );

Router.route("/:id/status").patch(
  rbacMiddleware.isPermission(["admin"]),
  validate({ params: idParams, body: updateStatusBody }),
  appointmentController.updateAppointmentStatus
);

Router.route("/:id/reschedule").patch(
  rbacMiddleware.isPermission(["admin"]),
  validate({ params: idParams, body: rescheduleBody }),
  appointmentController.rescheduleAppointment
);

Router.route("/:id")
  .get(
    rbacMiddleware.isPermission(["admin", "user"]),
    validate({ params: idParams }),
    appointmentController.getAppointment
  )
  .patch(
    rbacMiddleware.isPermission(["user", "admin"]),
    validate({ params: idParams }),
    appointmentController.updateAppointment
  )
  .delete(
    rbacMiddleware.isPermission(["user", "admin"]),
    validate({ params: idParams }),
    appointmentController.deleteAppointment
  );

module.exports = Router;
