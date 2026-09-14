const express = require("express");
const facilityController = require("../controllers/facilityController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const validate = require("../middlewares/validate");
const {
  createFacilityBody,
  updateFacilityBody,
  idParams
} = require("../validations/facilityValidation");

const router = express.Router();

router
  .route("/")
  .get(facilityController.getAllFacilities)
  .post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isPermission(["admin"]),
    validate({ body: createFacilityBody }),
    facilityController.createFacility
  );

router
  .route("/:id")
  .get(validate({ params: idParams }), facilityController.getFacility)
  .patch(
    authMiddleware.isAuthorized,
    rbacMiddleware.isPermission(["admin"]),
    validate({ params: idParams, body: updateFacilityBody }),
    facilityController.updateFacility
  )
  .delete(
    authMiddleware.isAuthorized,
    rbacMiddleware.isPermission(["admin"]),
    validate({ params: idParams }),
    facilityController.deleteFacility
  );

module.exports = router;
