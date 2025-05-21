const express = require("express");
const servicesController = require("../controllers/servicesController");
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const Router = express.Router();

Router.route("/").get(servicesController.getAllServices);
Router.route("/:id").get(servicesController.getService);

Router.use(
  authMiddleware.isAuthorized,
  rbacMiddleware.isPermission(["admin", "user"])
);
Router.route("/").post(servicesController.createService);
Router.route("/:id")
  .patch(servicesController.updateService)
  .delete(servicesController.deleteService);

module.exports = Router;
