const express = require("express");
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middlewares/authMiddleware");

const Router = express.Router();

Router.use(authMiddleware.isAuthorized);
Router.route("/")
  .get(messageController.getAllMessages)
  .post(messageController.setSenderIds, messageController.createMessage);
Router.route("/:conservationID").get(
  messageController.getMessageByConservation
);
module.exports = Router;
