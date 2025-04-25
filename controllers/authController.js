const { StatusCodes } = require("http-status-codes");
const QRCode = require("qrcode");
const { authenticator } = require("otplib");
const { OAuth2Client } = require("google-auth-library");
const ms = require("ms");
const JwtProvider = require("./../providers/JwtProvider");
const GoogleProvider = require("./../providers/GoogleProvider");
const CatchAsync = require("./../utils/catchAsync");
const AppError = require("../utils/appError");
const Account = require("../models/AccountModel");
const TwoFA = require("../models/TwoFAModel");
const AccountSession = require("../models/AccountsSessionModel");

const login = CatchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  const user = await Account.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("Incorrect email or password", 401));
  }
  const newAccountSession = await AccountSession.create({
    user_id: user._id,
    device_id: req.headers["user-agent"],
    is_2fa_verified: false,
    last_login: new Date().valueOf()
  });

  const payLoad = {
    id: user._id,
    email: user.email,
    role: user.role,
    require_2FA: user.require_2FA,
    is_2fa_verified: newAccountSession.is_2fa_verified,
    last_login: newAccountSession.last_login
  };

  // If everything is oke, send token to client
  await createSendToken(payLoad, req, res);
});

const logout = async (req, res) => {
  try {
    // Xóa Session trong DB
    await AccountSession.findOneAndDelete({
      user_id: req.user.id,
      device_id: req.headers["user-agent"]
    });
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
    const refreshTokenFromCookie = req.cookie?.refreshToken;
    // Verify Refresh Token
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      refreshTokenFromCookie,
      process.env.REFRESH_TOKEN_SIGNATURE
    );
    const payloadFromDecoded = {
      id: refreshTokenDecoded.id,
      email: refreshTokenDecoded.email,
      role: refreshTokenDecoded.role,
      password: refreshTokenDecoded.password,
      require_2FA: refreshTokenDecoded.require_2FA
    };

    const accessTokenNew = await JwtProvider.generateToken(
      payloadFromDecoded,
      process.env.ACCESS_TOKEN_SIGNATURE,
      "10 days"
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
  // WHEN I USE CREATE ACCOUNT.create(), it have a few helpful things like
  // - it will directly save on database
  // - it will return a promise
  // - it will automatically implement middlewares
  // - it will automatically catch errors
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

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

const createSendToken = async (payLoad, req, res) => {
  const accessToken = await JwtProvider.generateToken(
    payLoad,
    process.env.ACCESS_TOKEN_SIGNATURE,
    "10 days"
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
};
const get2FA_QRCode = CatchAsync(async (req, res) => {
  const user = await Account.findById(req.user.id);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "User not found"
    });
  }
  let twoFactorSecretKeyValue = null;
  const twoFactorSecretKey = await TwoFA.findOne({
    user_id: user._id
  });

  if (!twoFactorSecretKey) {
    const newTwoFA = await TwoFA.create({
      secret: authenticator.generateSecret(),
      user_id: user._id
    });
    twoFactorSecretKeyValue = newTwoFA.secret;
  } else {
    twoFactorSecretKeyValue = twoFactorSecretKey.secret;
  }
  const otpAuthToken = authenticator.keyuri(
    user.name,
    process.env.SERVICE_NAME_2FA,
    twoFactorSecretKeyValue
  );
  const qrCodeImage = await QRCode.toDataURL(otpAuthToken);

  res.status(StatusCodes.OK).json({
    message: "Get 2FA QR code successfully",
    data: qrCodeImage
  });
});
const setUp2FA = CatchAsync(async (req, res) => {
  const user = await Account.findById(req.user.id);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "User ID not found"
    });
  }
  const twoFactorSecretKey = await TwoFA.findOne({
    user_id: user._id
  });
  if (!twoFactorSecretKey) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "2FA secret key not found"
    });
  }
  const otpTokenClient = req.body.otpTokenClient;
  if (!otpTokenClient) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please provide OTP code"
    });
  }
  // console.log("otpTokenClient: ", twoFactorSecretKey.secret);
  const isValid = authenticator.verify({
    token: otpTokenClient,
    secret: twoFactorSecretKey.secret
  });
  if (!isValid) {
    return res.status(StatusCodes.NOT_ACCEPTABLE).json({
      message: "Invalid OTP code"
    });
  }
  const updatedUser = await Account.findByIdAndUpdate(
    { _id: user._id },
    { require_2FA: true },
    { new: true }
  );
  const newAccountSession = await AccountSession.create({
    user_id: user._id,
    device_id: req.headers["user-agent"],
    is_2fa_verified: true,
    last_login: new Date().valueOf()
  });
  res.status(StatusCodes.OK).json({
    message: "2FA setup successfully",
    data: {
      user: updatedUser,
      is_2fa_verified: newAccountSession.is_2fa_verified,
      last_login: newAccountSession.last_login
    }
  });
});
const verify2FA = CatchAsync(async (req, res) => {
  const user = await Account.findById(req.user.id);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "User ID not found"
    });
  }
  const twoFactorSecretKey = await TwoFA.findOne({
    user_id: user._id
  });
  if (!twoFactorSecretKey) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "2FA secret key not found"
    });
  }
  const otpTokenClient = req.body.otpTokenClient;
  if (!otpTokenClient) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please provide OTP code"
    });
  }
  const isValid = authenticator.verify({
    token: otpTokenClient,
    secret: twoFactorSecretKey.secret
  });
  if (!isValid) {
    return res.status(StatusCodes.NOT_ACCEPTABLE).json({
      message: "Invalid OTP code"
    });
  }
  const updatedAccountSession = await AccountSession.findOneAndUpdate(
    {
      user_id: user._id,
      device_id: req.headers["user-agent"]
    },
    { is_2fa_verified: true, last_login: new Date().valueOf() },
    { new: true }
  );
  res.status(StatusCodes.OK).json({
    message: "2FA verify successfully",
    data: {
      user: user,
      is_2fa_verified: updatedAccountSession.is_2fa_verified,
      last_login: updatedAccountSession.last_login
    }
  });
});
const loginGoogle = async (req, res) => {
  const { token } = req.body;
  const InfoGoogle = await GoogleProvider.verify(token);
  const { name, email: googleEmail } = InfoGoogle;

  const normalizedEmail = googleEmail.trim().toLowerCase();
  const user = await Account.findOne({ email: InfoGoogle.email });
  console.log("user: ", user);
  let newUser;

  if (!user) {
    newUser = await Account.create({
      name,
      email: normalizedEmail,
      password: normalizedEmail + process.env.GOOGLE_CLIENT_ID,
      passwordConfirm: normalizedEmail + process.env.GOOGLE_CLIENT_ID
    });
  } else {
    newUser = user;
  }
  const newAccountSession = await AccountSession.create({
    user_id: newUser._id,
    device_id: req.headers["user-agent"],
    is_2fa_verified: false,
    last_login: new Date().valueOf()
  });
  const payLoad = {
    id: newUser._id,
    email: newUser.email,
    role: newUser.role,
    require_2FA: newUser.require_2FA,
    is_2fa_verified: newAccountSession.is_2fa_verified,
    last_login: newAccountSession.last_login
  };
  await createSendToken(payLoad, req, res);
};
const authController = {
  login,
  logout,
  refreshToken,
  register,
  restrictTo,
  get2FA_QRCode,
  setUp2FA,
  verify2FA,
  loginGoogle
};
module.exports = authController;
