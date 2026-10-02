const factory = require("./handlerFactory");
const Message = require("../models/MessageModel");
const CatchAsync = require("../utils/catchAsync");

exports.setSenderIds = (req, res, next) => {
  if (!req.body) req.body = {};
  if (!req.body.senderID && req.user) req.body.senderID = req.user.id;
  next();
};
exports.getAllMessages = factory.getAll(Message);
exports.getMessageByID = factory.getOne(Message);
exports.createMessage = factory.createOne(Message);
exports.updateMessage = factory.updateOne(Message);
exports.deleteMessage = factory.deleteOne(Message);

exports.getMessageByConservation = CatchAsync(async (req, res) => {
  const { conservationID } = req.params;
  const messages = await Message.find({ conservationID });
  res.status(200).json({
    status: "success",
    data: {
      messages: messages
    }
  });
});

exports.uploadMedia = CatchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: "fail",
      message: "Vui lòng chọn tệp ảnh hoặc âm thanh!"
    });
  }

  const localStorage = require("../providers/LocalStorageProvider");
  const isAudio = req.file.mimetype.startsWith("audio/");
  const result = await localStorage.upload(req.file, {
    folder: "chat"
  });

  res.status(200).json({
    status: "success",
    data: {
      url: result.secure_url,
      resourceType: isAudio ? "audio" : "image"
    }
  });
});
