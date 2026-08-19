const express = require("express");
const Router = express.Router();

const availabilityController = require("../controllers/availabilityController");

Router.route("/slots").get(availabilityController.getAvailableSlots);

module.exports = Router;

