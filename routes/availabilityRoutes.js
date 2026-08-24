const express = require("express");
const Router = express.Router();

const availabilityController = require("../controllers/availabilityController");
const validate = require("../middlewares/validate");
const { slotsQuery } = require("../validations/availabilityValidation");

Router.route("/slots").get(
  validate({ query: slotsQuery }),
  availabilityController.getAvailableSlots
);

module.exports = Router;
