const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verify = async token => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  return payload;
};

const GoogleProvider = { verify };
module.exports = GoogleProvider;
