const express = require("express");
const conservationController = require("../controllers/conservationController");
const authMiddleware = require("../middlewares/authMiddleware");

const Router = express.Router();

Router.use(authMiddleware.isAuthorized);
Router.route("/")
  .get(conservationController.getAllConservations)
  .post(
    conservationController.setSenderIds,
    conservationController.createConservationWithMembers
  );
Router.route("/getConservationByMembers").get(
  conservationController.getConservationByMembers
);
module.exports = Router;
