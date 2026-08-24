const express = require("express");
const Router = express.Router();

const searchController = require("../controllers/searchController");

Router.route("/patients").get(searchController.searchPatients);
Router.route("/services").get(searchController.searchServices);
Router.route("/appointments").get(searchController.searchAppointments);

module.exports = Router;

