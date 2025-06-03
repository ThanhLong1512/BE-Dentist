const factory = require("./handlerFactory");
const Conservation = require("../models/ConservationModel");
const CatchAsync = require("../utils/catchAsync");

exports.getAllConservations = factory.getAll(Conservation);
exports.getConservationByID = factory.getOne(Conservation);
exports.createConservation = factory.createOne(Conservation);
exports.updateConservation = factory.updateOne(Conservation);
exports.deleteConservation = factory.deleteOne(Conservation);

exports.createConservationWithMembers = CatchAsync(async (req, res) => {
  //   const Conservation = await Conservation.create({
  //     member: [req.body.senderID, req.body.receiverID]
  //   });
  res.status(201).json({
    status: "success",
    data: {
      conservation: Conservation
    }
  });
});
