const { StatusCodes } = require("http-status-codes");
const JwtProvider = require("../providers/JwtProvider");

const isAuthorized = async (req, res, next) => {
  // // Cách 1: Lấy accessToken nằm trong request cookies phía client - withCredentials nhận được từ phía FE có hợp lệ hay
  const accessTokenFromCookie = req.cookies?.accessToken;
  if (!accessTokenFromCookie) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized (Token not found)!!" });
    return;
  }

  //Cách 2: Lấy accessToken trong trường hợp phía FE lưu localStorage và gửi lên thông qua header
  // Tại cách này chúng ta nên bỏ Bearer vì nó tuân theo quy tắc auth2.0
  // const accessTokenFromLocal = req.headers.authorization;
  // console.log("accessTokenFromLocal: ", accessTokenFromLocal);
  // if (!accessTokenFromLocal) {
  //   res
  //     .status(StatusCodes.UNAUTHORIZED)
  //     .json({ message: "Unauthorized (Token not found)!!" });
  //   return;
  // }

  try {
    const decoded = await JwtProvider.verifyToken(
      accessTokenFromCookie,
      process.env.ACCESS_TOKEN_SIGNATURE
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Error from authMiddleware:", error);
    // Trường hợp lỗi 01: Nếu cái accessToken nó bị hết hạn (expired) thì mình cần trả về mã lỗi GONE - 410 cho phía FE để biết gọi refreshToken
    if (error.message?.includes("jwt expired")) {
      res.status(StatusCodes.GONE).json({ message: "Need to refresh token" });
      return;
    }
    // Trương hợp lỗi 02: Nếu như cái accessToken nó không hợp lệ do bất kỳ thứ gì đó thì phải trả về mã 401 cho phía FE xử lý Logout/ hoặc gọi api Logout tùy trường hợp.
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized! Please Login" });
  }
};
const authMiddleware = { isAuthorized };
module.exports = authMiddleware;
