const { StatusCodes } = require("http-status-codes");
const JwtProvider = require("../providers/JwtProvider");

const getAccessToken = req => {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
};

const isAuthorized = async (req, res, next) => {
  const accessToken = getAccessToken(req);

  if (!accessToken) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized (Token not found)!!" });
    return;
  }

  try {
    const decoded = await JwtProvider.verifyToken(
      accessToken,
      process.env.ACCESS_TOKEN_SIGNATURE
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Error from authMiddleware:", error.message);
    if (error.message?.includes("jwt expired")) {
      res.status(StatusCodes.GONE).json({ message: "Need to refresh token" });
      return;
    }
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized! Please Login" });
  }
};

const authMiddleware = { isAuthorized };
module.exports = authMiddleware;
