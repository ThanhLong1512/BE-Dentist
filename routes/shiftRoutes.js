const express = require("express");
const shiftController = require("../controllers/shiftController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const Router = express.Router();

Router.route("/")
  .get(shiftController.getAllShift)
  .post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isPermission(["admin"]),
    shiftController.createShift
  );

Router.route("/:dayOfWeek").get(shiftController.getShiftsByDayOfWeek);

Router.use(authMiddleware.isAuthorized, rbacMiddleware.isPermission(["user"]));

Router.route("/:id")

  .patch(shiftController.updateShift)
  .delete(shiftController.deleteShift);

module.exports = Router;
