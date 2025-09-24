const express = require("express");
const servicesController = require("../controllers/servicesController");
const authMiddleware = require("../middlewares/authMiddleware");
const serviceMiddleware = require("../middlewares/serviceMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const Router = express.Router();

Router.route("/").get(servicesController.getAllServices);
Router.route("/:id").get(servicesController.getService);

Router.use(authMiddleware.isAuthorized, rbacMiddleware.isPermission(["admin"]));
Router.route("/duplicate/:id").post(servicesController.duplicateService);
Router.route("/").post(
  serviceMiddleware.uploadServicePhoto,
  servicesController.createService
);
Router.route("/:id")
  .patch(serviceMiddleware.uploadServicePhoto, servicesController.updateService)
  .delete(servicesController.deleteService);

module.exports = Router;
