const { StatusCodes } = require("http-status-codes");
const QRCode = require("qrcode");
const { authenticator } = require("otplib");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const ms = require("ms");
const nodemailer = require("nodemailer");
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

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Incorrect email or password"
    });
  }
  if (user.isLocked) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message:
        "Your account has been locked. Please contact admin for more information."
    });
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
    image: user.photo,
    require_2FA: user.require_2FA,
    is_2fa_verified: newAccountSession.is_2fa_verified,
    last_login: newAccountSession.last_login
  };

  await createSendToken(payLoad, req, res);
});

const logout = async (req, res) => {
  try {
    const user = await Account.findById(req.user.id);
    if (!user) {
      // Xóa Session trong DB
      await AccountSession.findOneAndDelete({
        user_id: req.user.id,
        device_id: req.headers["user-agent"]
      });
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
    }
    // Xóa Cookie
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
    image: newUser.photo,
    require_2FA: newUser.require_2FA,
    is_2fa_verified: newAccountSession.is_2fa_verified,
    last_login: newAccountSession.last_login
  };
  await createSendToken(payLoad, req, res);
});

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
const loginGoogle = CatchAsync(async (req, res) => {
  const { token } = req.body;
  const InfoGoogle = await GoogleProvider.verify(token);
  const { name, email: googleEmail, sub } = InfoGoogle;
  let normalizedEmail = "";
  if (googleEmail) {
    normalizedEmail = googleEmail.replace(/\s/g, "").toLowerCase();
  }
  const user = await Account.findOne({ googleID: sub });
  let newUser, payLoad;

  if (!user) {
    newUser = await Account.create({
      name,
      email: normalizedEmail,
      googleID: sub,
      password: normalizedEmail + process.env.GOOGLE_CLIENT_ID,
      passwordConfirm: normalizedEmail + process.env.GOOGLE_CLIENT_ID
    });
    const newAccountSession = await AccountSession.create({
      user_id: newUser._id,
      device_id: req.headers["user-agent"],
      is_2fa_verified: false,
      last_login: new Date().valueOf()
    });
  } else {
    newUser = user;
  }

  payLoad = {
    id: newUser._id,
    email: newUser.email,
    role: newUser.role,
    require_2FA: newUser.require_2FA,
    is_2fa_verified: newAccountSession.is_2fa_verified,
    last_login: newAccountSession.last_login
  };
  await createSendToken(payLoad, req, res);
});
const loginFacebook = CatchAsync(async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Access token is required"
    });
  }
  let response = await axios.get(
    `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`
  );
  const { id, name, email: facebookEmail } = response.data;
  if (!id) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Invalid access token"
    });
  }
  const account = await Account.findOne({ faceBookID: id });
  let newUser;

  if (!account) {
    newUser = await Account.create({
      name,
      email: facebookEmail,
      facebookID: id,
      password: normalizedEmail + process.env.FACEBOOK_CLIENT_ID,
      passwordConfirm: normalizedEmail + process.env.FACEBOOK_CLIENT_SECRET
    });
  } else {
    newUser = account;
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
});

function sendEmail({ recipient_email, OTP }) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_SENDER_PASSWORD
      }
    });

    const mail_configs = {
      from: process.env.EMAIL_SENDER,
      to: recipient_email,
      subject: "CHEESE DENTAL PASSWORD RECOVERY",
      html: htmlEmail(OTP)
    };
    transporter.sendMail(mail_configs, function(error, info) {
      if (error) {
        console.log(error);
        return reject({ message: `An error has occured` });
      }
      return resolve({ message: "Email sent succesfuly" });
    });
  });
}
const sendRecoveryEmail = CatchAsync(async (req, res) => {
  await sendEmail(req.body)
    .then(response =>
      res.status(200).json({
        message: "Successfully sent email",
        data: response
      })
    )
    .catch(error => res.status(500).send(error.message));
});
const htmlEmail = OTP => {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phòng Khám Nha Khoa Cheese - Mã OTP</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
    
    body {
      font-family: 'Roboto', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .header {
      background-color: #18a4e0;
      padding: 30px 20px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: white;
      letter-spacing: 1px;
    }
    
    .logo span {
      color: #ffcc29;
    }
    
    .tooth-icon {
      font-size: 24px;
      margin-right: 5px;
      vertical-align: middle;
    }
    
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    
    .greeting {
      font-size: 22px;
      font-weight: 500;
      margin-bottom: 20px;
      color: #2c3e50;
    }
    
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #555;
    }
    
    .otp-box {
      background-color: #f8f9fa;
      border: 2px dashed #18a4e0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    
    .otp-code {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 5px;
      color: #18a4e0;
    }
    
    .note {
      font-size: 14px;
      color: #777;
      margin-top: 10px;
      font-style: italic;
    }
    
    .divider {
      height: 1px;
      background-color: #eaeaea;
      margin: 30px 0;
    }
    
    .footer {
      padding: 20px 30px;
      background-color: #f8f9fa;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    
    .contact-info {
      margin-top: 15px;
    }
    
    .contact-item {
      margin-bottom: 5px;
    }
    
    .highlight {
      color: #18a4e0;
      font-weight: 500;
    }
    
    .social-icons {
      margin-top: 20px;
    }
    
    .social-icons a {
      display: inline-block;
      margin: 0 8px;
      color: #18a4e0;
      text-decoration: none;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #18a4e0;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: 500;
      margin-top: 20px;
      transition: background-color 0.3s;
    }
    
    .cta-button:hover {
      background-color: #1493c9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <span class="tooth-icon">🦷</span> PHÒNG KHÁM NHA KHOA <span>CHEESE</span>
      </div>
    </div>
    
    <div class="content">
      <div class="greeting">Xin chào quý khách,</div>
      
      <div class="message">
        Cảm ơn quý khách đã tin tưởng và lựa chọn dịch vụ của <span class="highlight">Phòng Khám Nha Khoa Cheese</span>. Để hoàn tất quá trình xác thực, vui lòng sử dụng mã OTP dưới đây:
      </div>
      
      <div class="otp-box">
        <div class="otp-code">${OTP}</div>
        <div class="note">Mã OTP có hiệu lực trong vòng 5 phút</div>
      </div>
      
      <div class="message">
        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ ngay với chúng tôi để được hỗ trợ.
      </div>
      
      <a href="https://cheesedental.com/appointments" class="cta-button">Đặt Lịch Khám</a>
      
      <div class="divider"></div>
      
      <div class="message">
        Chúng tôi luôn sẵn sàng phục vụ và mang đến cho quý khách những trải nghiệm tốt nhất với dịch vụ nha khoa chất lượng cao.
      </div>
    </div>
    
    <div class="footer">
      <div><strong>PHÒNG KHÁM NHA KHOA CHEESE</strong></div>
      
      <div class="contact-info">
        <div class="contact-item">📍 123 Nguyễn Huệ, Quận 1, TP.HCM</div>
        <div class="contact-item">📞 0987.654.321</div>
        <div class="contact-item">✉️ info@cheesedental.com</div>
        <div class="contact-item">🌐 www.cheesedental.com</div>
      </div>
      
      <div class="social-icons">
        <a href="#">Facebook</a> | <a href="#">Instagram</a> | <a href="#">YouTube</a> | <a href="#">Zalo</a>
      </div>
      
      <div class="note" style="margin-top: 20px;">
        © 2025 Phòng Khám Nha Khoa Cheese. Tất cả các quyền được bảo lưu.
      </div>
    </div>
  </div>
</body>
</html>`;
};
const resetPassword = CatchAsync(async (req, res) => {
  const { password, passwordConfirm, email } = req.body;
  const user = await Account.findOne({ email });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Your Email is not exist. Please check again!"
    });
  }
  user.password = req.body.password;
  user.save();
  res.status(StatusCodes.OK).json({
    message: "Password updated successfully"
  });
});
const authController = {
  login,
  logout,
  refreshToken,
  register,
  get2FA_QRCode,
  setUp2FA,
  verify2FA,
  loginGoogle,
  loginFacebook,
  sendRecoveryEmail,
  resetPassword
};
module.exports = authController;
