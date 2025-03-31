const express = require("express");
const servicesController = require("../controllers/servicesController");

const Router = express.Router();

Router.get("/", servicesController.getServices);
Router.post("/", servicesController.createService);
Router.get("/:id", servicesController.getServiceById);
Router.put("/:id", servicesController.updateService);
Router.delete("/:id", servicesController.deleteService);

module.exports = Router;
