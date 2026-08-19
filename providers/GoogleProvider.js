const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verify = async idToken => {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Invalid or missing Google ID token");
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub) {
    throw new Error("Invalid Google token payload");
  }

  return payload;
};

const GoogleProvider = { verify };
module.exports = GoogleProvider;
