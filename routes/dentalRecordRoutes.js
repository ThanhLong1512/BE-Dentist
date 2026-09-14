const express = require("express");
const DentalRecordController = require("../controllers/dentalRecordController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const validate = require("../middlewares/validate");
const {
  patientIdParams,
  sessionIdParams,
  updateMedicalHistoryBody,
  updateToothBody,
  batchUpdateTeethBody,
  addTreatmentSessionBody
} = require("../validations/dentalRecordValidation");

const Router = express.Router({ mergeParams: true });

Router.use(
  authMiddleware.isAuthorized,
  rbacMiddleware.isPermission(["admin", "user"])
);

Router.route("/patient/:patientId")
  .get(validate({ params: patientIdParams }), DentalRecordController.getPatientRecord);

Router.route("/patient/:patientId/medical-history")
  .patch(
    validate({ params: patientIdParams, body: updateMedicalHistoryBody }),
    DentalRecordController.updateMedicalHistory
  );

Router.route("/patient/:patientId/tooth")
  .patch(
    validate({ params: patientIdParams, body: updateToothBody }),
    DentalRecordController.updateTooth
  );

Router.route("/patient/:patientId/teeth/batch")
  .patch(
    validate({ params: patientIdParams, body: batchUpdateTeethBody }),
    DentalRecordController.batchUpdateTeeth
  );

Router.route("/patient/:patientId/sessions")
  .post(
    validate({ params: patientIdParams, body: addTreatmentSessionBody }),
    DentalRecordController.addTreatmentSession
  );

Router.route("/patient/:patientId/sessions/:sessionId")
  .delete(
    validate({ params: sessionIdParams }),
    DentalRecordController.deleteTreatmentSession
  );

module.exports = Router;
