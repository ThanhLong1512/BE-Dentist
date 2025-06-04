const factory = require("./handlerFactory");
const Message = require("../models/MessageModel");
const CatchAsync = require("../utils/catchAsync");

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
