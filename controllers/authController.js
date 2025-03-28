const { StatusCodes } = require("http-status-codes");
const ms = require("ms");
const JwtProvider = require("./../providers/JwtProvider");
const CatchAsync = require("./../utils/catchAsync");
const AppError = require("../utils/appError");
const Account = require("../models/AccountModel");

const login = CatchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  const user = await Account.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const payLoad = {
    id: user._id,
    email: user.email,
    password: user.password,
    role: user.role
  };
  const accessToken = await JwtProvider.generateToken(
    payLoad,
    process.env.ACCESS_TOKEN_SIGNATURE,
    "3h"
  );
  const refreshToken = await JwtProvider.generateToken(
    payLoad,
    process.env.REFRESH_TOKEN_SIGNATURE,
    "30 days"
  );
  res.cookie("accessToken", accessToken, {
    maxAge: ms("30 days"),
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
  res.cookie("refreshToken", refreshToken, {
    maxAge: ms("30 days"),
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
  res.clearCookie("__sbref");
  res.status(StatusCodes.OK).json({ ...payLoad, accessToken, refreshToken });
  // If everything is oke, send token to client
});

const logout = async (req, res) => {
  try {
    // Xóa Cookie
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(StatusCodes.OK).json({ message: "Logout API success" });
  } catch (error) {
    //
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const refreshToken = async (req, res) => {
  try {
    // Cách 1: Lấy refreshToken từ Cookie đã đính kèm vào request
    const refreshTokenFromCookie = req.cookie?.refreshToken;

    // Cách 2: Từ localStorage phía FE sẽ truyền vào body khi gọi API
    const refreshTokenFromBody = req.body?.refreshToken;
    // Verify Refresh Token
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      refreshTokenFromBody,
      process.env.REFRESH_TOKEN_SIGNATURE
    );
    const payloadFromDecoded = {
      id: refreshTokenDecoded.id,
      email: refreshTokenDecoded.email,
      role: refreshTokenDecoded.role,
      password: refreshTokenDecoded.password
    };

    const accessTokenNew = await JwtProvider.generateToken(
      payloadFromDecoded,
      process.env.ACCESS_TOKEN_SIGNATURE,
      "1h"
    );
    res.cookie("accessToken", accessTokenNew, {
      maxAge: ms("30 days"),
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });
    res.status(StatusCodes.OK).json({ accessTokenNew });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Refresh Token API failed" });
  }
};

const register = CatchAsync(async (req, res) => {
  const emailExisting = await Account.findOne({ email: req.body.email });
  if (emailExisting) {
    return res.status(StatusCodes.CONFLICT).json({
      message: "Email already exists. Please use another email!"
    });
  }
  const newUser = await Account.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  const payLoad = {
    id: newUser._id,
    email: newUser.email,
    role: newUser.role,
    password: newUser.password
  };
  await createSendToken(payLoad, req, res);
});

const authController = { login, logout, refreshToken, register };
module.exports = authController;
