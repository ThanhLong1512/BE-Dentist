const factory = require("./handlerFactory");
const Conservation = require("../models/ConservationModel");
const CatchAsync = require("../utils/catchAsync");

exports.setSenderIds = (req, res, next) => {
  if (!req.body.senderID) req.body.senderID = req.user.id;
  next();
};
exports.getAllConservations = factory.getAll(Conservation);
exports.getConservationByID = factory.getOne(Conservation);
exports.createConservation = factory.createOne(Conservation);
exports.updateConservation = factory.updateOne(Conservation);
exports.deleteConservation = factory.deleteOne(Conservation);

exports.createConservationWithMembers = CatchAsync(async (req, res) => {
  const senderID = req.body.senderID;
  const adminID = process.env.ADMIN_ID;
  const existingConservation = await Conservation.findOne({
    member: { $all: [senderID, adminID] }
  });

  if (existingConservation) {
    return res.status(200).json({
      status: "success",
      message: "Conversation already exists",
      data: {
        conservation: existingConservation
      }
    });
  }

  const newConservation = new Conservation({
    member: [senderID, adminID]
  });

  const savedConservation = await newConservation.save();

  res.status(201).json({
    status: "success",
    message: "New conversation created",
    data: {
      conservation: savedConservation
    }
  });
});
exports.getConservationByMembers = CatchAsync(async (req, res) => {
  const conservation = await Conservation.find({
    member: { $in: [req.user.id] }
  }).populate({
    path: "member",
    model: "Account",
    select: "name email photo",
    match: { _id: { $ne: req.user.id } }
  });

  res.status(200).json({
    status: "success",
    data: {
      conservation: conservation
    }
  });
});
