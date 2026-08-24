const express = require("express");
const PatientController = require("../controllers/patientController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const validate = require("../middlewares/validate");
const {
  createPatientBody,
  updatePatientBody,
  idParams
} = require("../validations/patientValidation");

const Router = express.Router({ mergeParams: true });

Router.use(
  authMiddleware.isAuthorized,
  rbacMiddleware.isPermission(["admin", "user"])
);

Router.route("/")
  .get(PatientController.getAllPatients)
  .post(
    PatientController.setAccountId,
    validate({ body: createPatientBody }),
    PatientController.createPatient
  );
Router.route("/duplicate/:id").post(
  validate({ params: idParams }),
  PatientController.duplicatePatient
);
Router.route("/:id")
  .get(validate({ params: idParams }), PatientController.getPatient)
  .patch(
    validate({ params: idParams, body: updatePatientBody }),
    PatientController.updatePatient
  )
  .delete(validate({ params: idParams }), PatientController.deletePatient);

module.exports = Router;
