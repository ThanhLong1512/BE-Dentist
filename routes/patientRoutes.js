const express = require("express");
const PatientController = require("../controllers/PatientController");

const Router = express.Router();

Router.get("/", PatientController.getPatients);
Router.post("/", PatientController.createPatient);
Router.get("/:id", PatientController.getPatientById);
Router.put("/:id", PatientController.updatePatient);
Router.delete("/:id", PatientController.deletePatient);

module.exports = Router;
