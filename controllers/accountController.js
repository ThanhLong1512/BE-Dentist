const Account = require("./../models/AccountModel");
const AccountSession = require("./../models/AccountsSessionModel");
const TwoFA = require("./../models/TwoFAModel");
const factory = require("./handlerFactory");
const CatchAsync = require("./../utils/catchAsync");
const cloudinary = require("../providers/CloudinaryProvider");
const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");
const stream = require("stream");

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
  // Tạm thời comment - không dùng AWS KMS nữa
  // Mã hóa dữ liệu nhạy cảm bằng aws-kms
  // if (account) {
  //   await account.setPersonalInfo(userID);
  // }
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
exports.updateMyAccount = CatchAsync(async (req, res) => {
  const userID = req.user.id;
  let updateData = { ...req.body };

  if (req.file) {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "dental-services",
          transformation: [{ width: 500, height: 500, crop: "fill" }]
        },
        async (error, result) => {
          if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              status: "Failed",
              message: "Failed to upload image. Please try again.",
              error: error.message
            });
          }
          updateData.photo = result.secure_url;
          updateData.photoPublicId = result.public_id;

          try {
            const updatedAccount = await Account.findByIdAndUpdate(
              userID,
              updateData,
              {
                new: true,
                runValidators: true
              }
            );

            if (!updatedAccount) {
              return res.status(StatusCodes.NOT_FOUND).json({
                status: "Failed",
                message: "No account found with that ID"
              });
            }

            res.status(StatusCodes.OK).json({
              status: "Success",
              data: {
                data: updatedAccount
              }
            });
          } catch (dbError) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              status: "Failed",
              message: "Failed to update account",
              error: dbError.message
            });
          }
        }
      );

      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);
      bufferStream.pipe(uploadStream);
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "Failed",
        message: "Failed to upload image. Please try again.",
        error: error.message
      });
    }
  } else {
    try {
      if (updateData.password || updateData.currentPassword) {
        const user = await Account.findById(userID).select("+password");
        if (!user) {
          return res.status(StatusCodes.NOT_FOUND).json({
            status: "Failed",
            message: "No account found with that ID"
          });
        }

        if (updateData.currentPassword) {
          const isCurrentPasswordCorrect = await bcrypt.compare(
            updateData.currentPassword,
            user.password
          );

          if (!isCurrentPasswordCorrect) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              status: "Failed",
              message: "The current password you entered is incorrect"
            });
          }
        }

        Object.keys(updateData).forEach(key => {
          if (key !== "currentPassword") {
            user[key] = updateData[key];
          }
        });

        const updatedUser = await user.save();

        res.status(StatusCodes.OK).json({
          status: "Success",
          data: {
            data: updatedUser
          }
        });
      } else {
        const updatedAccount = await Account.findByIdAndUpdate(
          userID,
          updateData,
          {
            new: true,
            runValidators: true
          }
        );

        if (!updatedAccount) {
          return res.status(StatusCodes.NOT_FOUND).json({
            status: "Failed",
            message: "No account found with that ID"
          });
        }

        res.status(StatusCodes.OK).json({
          status: "Success",
          data: {
            data: updatedAccount
          }
        });
      }
    } catch (error) {
      console.error("Update account error:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "Failed",
        message: "Failed to update account",
        error: error.message
      });
    }
  }
});

// User xóa tài khoản của chính mình (yêu cầu xác nhận mật khẩu)
exports.deleteMyAccount = CatchAsync(async (req, res) => {
  const userID = req.user.id;
  const { password } = req.body;

  if (!password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "Failed",
      message: "Please provide your password to confirm account deletion"
    });
  }

  const account = await Account.findById(userID).select("+password");
  if (!account) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: "Failed",
      message: "Account not found"
    });
  }

  const isPasswordCorrect = await bcrypt.compare(password, account.password);
  if (!isPasswordCorrect) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: "Failed",
      message: "Incorrect password. Account deletion cancelled"
    });
  }

  // Xóa dữ liệu liên quan trước
  await AccountSession.deleteMany({ user_id: userID });
  await TwoFA.deleteMany({ user_id: userID });
  await Account.findByIdAndDelete(userID);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(StatusCodes.OK).json({
    status: "Success",
    message: "Your account has been deleted successfully"
  });
});

// Admin xóa tài khoản khác
exports.deleteAccount = CatchAsync(async (req, res) => {
  const accountId = req.params.id;
  const currentUserId = req.user.id;

  if (accountId === currentUserId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "Failed",
      message: "Use deleteMe endpoint to delete your own account"
    });
  }

  const account = await Account.findById(accountId);
  if (!account) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: "Failed",
      message: "Account not found"
    });
  }

  await AccountSession.deleteMany({ user_id: accountId });
  await TwoFA.deleteMany({ user_id: accountId });
  await Account.findByIdAndDelete(accountId);

  return res.status(StatusCodes.OK).json({
    status: "Success",
    message: "Account deleted successfully"
  });
});
