const Account = require("./../models/AccountModel");
const factory = require("./handlerFactory");
// const catchAsync = require('./../utils/catchAsync');

exports.setAccountIds = (req, res, next) => {
  if (!req.body.account) req.body.account = req.user.id;
  next();
};

exports.getAllAccounts = factory.getAll(Account);
exports.getAccount = factory.getOne(Account);
exports.updateAccount = factory.updateOne(Account);
