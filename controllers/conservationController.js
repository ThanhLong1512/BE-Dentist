const factory = require("./handlerFactory");
const Conservation = require("../models/ConservationModel");
const CatchAsync = require("../utils/catchAsync");

const Account = require("../models/AccountModel");
const Message = require("../models/MessageModel");

exports.setSenderIds = (req, res, next) => {
  if (!req.body) req.body = {};
  if (!req.body.senderID && req.user) req.body.senderID = req.user.id;
  next();
};
exports.getAllConservations = factory.getAll(Conservation);
exports.getConservationByID = factory.getOne(Conservation);
exports.createConservation = factory.createOne(Conservation);
exports.updateConservation = factory.updateOne(Conservation);
exports.deleteConservation = factory.deleteOne(Conservation);

exports.createConservationWithMembers = CatchAsync(async (req, res) => {
  if (!req.body) req.body = {};
  const senderID = req.body.senderID || req.user.id;
  let adminID = process.env.ADMIN_ID;

  if (!adminID) {
    const adminAcc = await Account.findOne({ role: "admin" });
    adminID = adminAcc ? adminAcc._id.toString() : null;
  }

  let existingConservation = null;
  if (adminID && senderID) {
    if (senderID.toString() === adminID.toString()) {
      existingConservation = await Conservation.findOne({
        member: { $in: [adminID] }
      });
    } else {
      existingConservation = await Conservation.findOne({
        member: { $all: [senderID, adminID] }
      });
    }
  }

  if (existingConservation) {
    return res.status(200).json({
      status: "success",
      message: "Conversation already exists",
      data: {
        conservation: existingConservation
      }
    });
  }

  const members =
    adminID && adminID.toString() !== senderID.toString()
      ? [senderID, adminID]
      : [senderID];
  const newConservation = new Conservation({
    member: members
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
  const userId = req.user.id;
  const adminIdEnv = process.env.ADMIN_ID;
  const isAdmin =
    req.user.role === "admin" ||
    req.user.role === "staff" ||
    req.user.role === "employee" ||
    req.user.role === "doctor" ||
    req.user.role === "reception" ||
    (adminIdEnv && userId && userId.toString() === adminIdEnv.toString());

  let conversations = [];
  if (isAdmin) {
    conversations = await Conservation.find({ "member.0": { $exists: true } })
      .populate({
        path: "member",
        model: "Account",
        select: "name email photo role phone"
      })
      .sort({ updatedAt: -1 });
  } else {
    conversations = await Conservation.find({
      member: { $in: [userId] }
    })
      .populate({
        path: "member",
        model: "Account",
        select: "name email photo role phone"
      })
      .sort({ updatedAt: -1 });
  }

  const results = await Promise.all(
    conversations.map(async (conv) => {
      const convObj = conv.toObject();
      const lastMessage = await Message.findOne({ conservationID: conv._id })
        .sort({ createdAt: -1 })
        .lean();

      convObj.lastMessage = lastMessage || null;

      const validMembers = (convObj.member || []).filter(Boolean);
      convObj.member = validMembers;

      let otherMember = null;
      if (isAdmin) {
        otherMember =
          validMembers.find(
            (m) =>
              (m?._id || m)?.toString() !== userId.toString() &&
              m?.role !== "admin" &&
              m?.email !== "admin@gmail.com"
          ) ||
          validMembers.find(
            (m) => (m?._id || m)?.toString() !== userId.toString()
          ) ||
          validMembers[0] ||
          null;
      } else {
        otherMember =
          validMembers.find(
            (m) => (m?._id || m)?.toString() !== userId.toString()
          ) ||
          validMembers[0] ||
          null;
      }

      convObj.otherMember = otherMember;

      return convObj;
    })
  );

  results.sort((a, b) => {
    const timeA = a.lastMessage?.createdAt
      ? new Date(a.lastMessage.createdAt).getTime()
      : new Date(a.updatedAt).getTime();
    const timeB = b.lastMessage?.createdAt
      ? new Date(b.lastMessage.createdAt).getTime()
      : new Date(b.updatedAt).getTime();
    return timeB - timeA;
  });

  res.status(200).json({
    status: "success",
    data: {
      conservation: results
    }
  });
});
