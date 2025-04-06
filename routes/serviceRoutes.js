const express = require("express");
const servicesController = require("../controllers/servicesController");
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");

const Router = express.Router();



// Define routes for service-related operations
Router.route("/")
  .get(servicesController.getServices)
  .post(servicesController.createService);
Router.use(authMiddleware.isAuthorized);
Router.route("/:id")
  .get(servicesController.getServiceById)
  .put(servicesController.updateService)
  .delete(servicesController.deleteService);

module.exports = Router;
