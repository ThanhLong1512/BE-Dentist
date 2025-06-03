const factory = require("./handlerFactory");
const Message = require("../models/MessageModel");

exports.getAllMessages = factory.getAll(Message);
exports.getMessageByID = factory.getOne(Message);
exports.createMessage = factory.createOne(Message);
exports.updateMessage = factory.updateOne(Message);
exports.deleteMessage = factory.deleteOne(Message);
