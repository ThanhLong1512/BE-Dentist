const express = require("express");
const PatientController = require("../controllers/patientController");
const authMiddleware = require("../middlewares/authMiddleware");

const Router = express.Router();

Router.use(authMiddleware.isAuthorized); // Apply authentication middleware to all routes

// Define routes for patient-related operations
Router.route("/")
  .get(PatientController.getPatients)
  .post(PatientController.createPatient);
Router.route("/:id")
  .get(PatientController.getPatientById)
  .put(PatientController.updatePatient)
  .delete(PatientController.deletePatient);

module.exports = Router;
