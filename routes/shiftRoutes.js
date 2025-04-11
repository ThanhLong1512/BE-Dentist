const express = require("express");
const shiftController = require("../controllers/shiftController");
const authMiddleware = require("../middlewares/authMiddleware");

const Router = express.Router();

Router.route("/")
  .get(shiftController.getShifts)
  .post(shiftController.createShift);

Router.route("/:dayOfWeek").get(shiftController.getShiftsByDayOfWeek);

Router.use(authMiddleware.isAuthorized);
Router.route("/:id")
  .get(shiftController.getShiftById)
  .put(shiftController.updateShift)
  .delete(shiftController.deleteShift);

module.exports = Router;
