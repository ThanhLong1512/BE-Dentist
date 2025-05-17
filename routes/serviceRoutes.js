const express = require("express");
const servicesController = require("../controllers/servicesController");
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const Router = express.Router();

// Define routes for service-related operations
Router.route("/").get(servicesController.getServices);
Router.route("/:id").get(servicesController.getServiceById);

Router.use(
  authMiddleware.isAuthorized,
  rbacMiddleware.isPermission(["admin", "user"])
);
Router.route("/").post(servicesController.createService);
Router.route("/:id")
  .patch(servicesController.updateService)
  .delete(servicesController.deleteService);

module.exports = Router;
