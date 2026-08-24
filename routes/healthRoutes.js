const express = require("express");
const healthController = require("../controllers/healthController");

const Router = express.Router();

Router.get("/", healthController.getHealth);

module.exports = Router;
