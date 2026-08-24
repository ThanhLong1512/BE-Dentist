const express = require("express");
const servicesController = require("../controllers/servicesController");
const authMiddleware = require("../middlewares/authMiddleware");
const serviceMiddleware = require("../middlewares/serviceMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const validate = require("../middlewares/validate");
const {
  createServiceBody,
  updateServiceBody,
  idParams
} = require("../validations/serviceValidation");

const Router = express.Router();

Router.route("/").get(servicesController.getAllServices);
Router.route("/:id").get(
  validate({ params: idParams }),
  servicesController.getService
);

Router.use(authMiddleware.isAuthorized, rbacMiddleware.isPermission(["admin"]));
Router.route("/duplicate/:id").post(
  validate({ params: idParams }),
  servicesController.duplicateService
);
Router.route("/").post(
  serviceMiddleware.uploadServicePhoto,
  validate({ body: createServiceBody }),
  servicesController.createService
);
Router.route("/:id")
  .patch(
    serviceMiddleware.uploadServicePhoto,
    validate({ params: idParams, body: updateServiceBody }),
    servicesController.updateService
  )
  .delete(validate({ params: idParams }), servicesController.deleteService);

module.exports = Router;
