const twilio = require("twilio");

let client = null;

const getClient = () => {
  if (client) return client;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_ACCOUNT_TOKEN) {
    return null;
  }
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_ACCOUNT_TOKEN
  );
  return client;
};

const sendSMS = async ({ to, message }) => {
  const twilioClient = getClient();
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn("Twilio not configured, skip SMS");
    return null;
  }

  return twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to
  });
};

module.exports = { sendSMS };
