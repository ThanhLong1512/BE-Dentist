const express = require("express");
const PatientController = require("../controllers/patientController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const Router = express.Router({ mergeParams: true });

Router.use(
  authMiddleware.isAuthorized,
  rbacMiddleware.isPermission(["admin", "user"])
);

Router.route("/")
  .get(PatientController.getAllPatients)
  .post(PatientController.setAccountId, PatientController.createPatient);

Router.route("/:id")
  .get(PatientController.getPatient)
  .patch(PatientController.updatePatient)
  .delete(PatientController.deletePatient);

module.exports = Router;
