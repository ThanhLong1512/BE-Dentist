const JWT = require("jsonwebtoken");

const generateToken = async (payLoad, secretSignature, tokenLife) => {
  try {
    return JWT.sign(payLoad, secretSignature, {
      algorithm: "HS256",
      expiresIn: tokenLife
    });
  } catch (error) {
    throw new Error(error.message());
  }
};
const verifyToken = async (token, secretSignature) => {
  try {
    return JWT.verify(token, secretSignature);
  } catch (error) {
    throw new Error(error.message());
  }
};
const JwtProvider = { generateToken, verifyToken };
module.exports = JwtProvider;
