const express = require("express");
const settingController = require("../controllers/settingController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const validate = require("../middlewares/validate");
const { updateSettingBody } = require("../validations/settingValidation");

const router = express.Router();

router
  .route("/")
  .get(settingController.getSettings)
  .patch(
    authMiddleware.isAuthorized,
    rbacMiddleware.isPermission(["admin"]),
    validate({ body: updateSettingBody }),
    settingController.updateSettings
  );

router.post(
  "/reset",
  authMiddleware.isAuthorized,
  rbacMiddleware.isPermission(["admin"]),
  settingController.resetSettings
);

module.exports = router;
