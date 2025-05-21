const Account = require("./../models/AccountModel");
const factory = require("./handlerFactory");
const CatchAsync = require("./../utils/catchAsync");
const { StatusCodes } = require("http-status-codes");
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

  return res.status(StatusCodes.OK).json({
    status: "Successful",
    data: {
      data: account
    }
  });
});
exports.getAllAccounts = factory.getAll(Account);
exports.getAccount = factory.getOne(Account);
exports.updateAccount = CatchAsync(async (req, res) => {
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
            throw error;
          }
          updateData.photo = result.secure_url;
          updateData.photoPublicId = result.public_id;

          const updatedAccount = await Account.findByIdAndUpdate(
            userID,
            updateData,
            {
              new: true,
              runValidators: true
            }
          );

          res.status(StatusCodes.OK).json({
            status: "Success",
            data: {
              data: updatedAccount
            }
          });
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

    res.status(StatusCodes.OK).json({
      status: "Success",
      data: {
        data: updatedAccount
      }
    });
  }
});
