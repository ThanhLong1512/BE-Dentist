const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_SENDER_PASSWORD
    }
  });

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_SENDER || !process.env.EMAIL_SENDER_PASSWORD) {
    console.warn("Email credentials missing, skip send");
    return null;
  }

  const transporter = createTransporter();
  return transporter.sendMail({
    from: process.env.EMAIL_SENDER,
    to,
    subject,
    html,
    text
  });
};

module.exports = { sendEmail };
