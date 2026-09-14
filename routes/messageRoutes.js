const express = require("express");
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middlewares/authMiddleware");

const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

const Router = express.Router();

Router.use(authMiddleware.isAuthorized);
Router.route("/upload").post(
  upload.single("file"),
  messageController.uploadMedia
);
Router.route("/")
  .get(messageController.getAllMessages)
  .post(messageController.setSenderIds, messageController.createMessage);
Router.route("/:conservationID").get(
  messageController.getMessageByConservation
);
module.exports = Router;
