const Account = require("./../models/AccountModel");
const factory = require("./handlerFactory");
const CatchAsync = require("./../utils/catchAsync");
const localStorage = require("../providers/LocalStorageProvider");
const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");

exports.setAccountIds = (req, res, next) => {
  if (!req.body.account) req.body.account = req.user.id;
  next();
};

exports.getAccountByUser = CatchAsync(async (req, res) => {
  const userID = req.user.id;
  const account = await Account.findById(userID);

  if (!userID) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Please Login to check your order"
    });
  }

  if (!account) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No one order for this account" });
  }

  return res.status(StatusCodes.OK).json({
    status: "Successful",
    data: {
      data: account
    }
  });
});
exports.getAllAccounts = factory.getAll(Account);
exports.getAccount = factory.getOne(Account);
exports.updateAccount = factory.updateOne(Account);

const uploadImageBuffer = async (file) => {
  return await localStorage.upload(file, { folder: "avatars" });
};

exports.updateMyAccount = CatchAsync(async (req, res) => {
  const userID = req.user.id;
  let updateData = {};

  // Allow safe profile fields
  if (req.body.name && typeof req.body.name === "string") {
    updateData.name = req.body.name.trim();
  }
  if (req.body.phone && typeof req.body.phone === "string") {
    updateData.phone = req.body.phone.trim();
  }
  if (req.body.gender) updateData.gender = req.body.gender;
  if (req.body.dateOfBirth) updateData.dateOfBirth = req.body.dateOfBirth;
  if (req.body.address) updateData.address = req.body.address;

  // Handle password update if passed
  if (req.body.password || req.body.currentPassword) {
    const user = await Account.findById(userID).select("+password");
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "Failed",
        message: "No account found with that ID"
      });
    }

    if (req.body.currentPassword) {
      const isCurrentPasswordCorrect = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );

      if (!isCurrentPasswordCorrect) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "Failed",
          message: "The current password you entered is incorrect"
        });
      }
    }

    if (req.body.password) {
      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;
      const updatedUser = await user.save();
      return res.status(StatusCodes.OK).json({
        status: "Success",
        data: {
          data: updatedUser
        }
      });
    }
  }

  // Handle avatar upload
  if (req.file) {
    try {
      const result = await uploadImageBuffer(req.file);
      updateData.photo = result.secure_url;
      updateData.photoPublicId = result.public_id;
    } catch (uploadError) {
      console.warn(
        "Cloudinary upload failed, falling back to data URI:",
        uploadError.message
      );
      const mime = req.file.mimetype || "image/jpeg";
      const base64 = req.file.buffer.toString("base64");
      updateData.photo = `data:${mime};base64,${base64}`;
      updateData.photoPublicId = "inline_avatar";
    }
  }

  const updatedAccount = await Account.findByIdAndUpdate(userID, updateData, {
    new: true,
    runValidators: true
  });

  if (!updatedAccount) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: "Failed",
      message: "No account found with that ID"
    });
  }

  return res.status(StatusCodes.OK).json({
    status: "Success",
    data: {
      data: updatedAccount
    }
  });
});
