const { StatusCodes } = require("http-status-codes");
const ms = require("ms");
const JwtProvider = require("./../providers/JwtProvider");

const MOCK_DATABASE = {
  USER: {
    ID: "thanhlong-sample-id-12345678",
    EMAIL: "thanhlongdev.official@gmail.com",
    PASSWORD: "thanhlongdev@123",
    ROLE: "USER"
  }
};

const login = async (req, res) => {
  try {
    const { EMAIL, PASSWORD } = MOCK_DATABASE.USER;
    if (req.body.email !== EMAIL || req.body.password !== PASSWORD) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Your email or password is incorrect!" });
      return;
    }
    const payLoad = {
      id: MOCK_DATABASE.USER.ID,
      email: MOCK_DATABASE.USER.EMAIL,
      password: MOCK_DATABASE.USER.PASSWORD,
      role: MOCK_DATABASE.USER.ROLE
    };
    const accessToken = await JwtProvider.generateToken(
      payLoad,
      process.env.ACCESS_TOKEN_SIGNATURE,
      "1h"
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
    res.status(StatusCodes.OK).json({ ...payLoad, accessToken, refreshToken });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong!" });
  }
};

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

const authController = { login, logout, refreshToken };
module.exports = authController;
