require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const logger = require("./logger");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const EMAIL_TEMPLATES = {
  verification: "d-eb1383d5260b4f75a4a980cc4e0564ad",
};

const sendVerificationEmail = async (name, email, token) => {
  const msg = {
    to: email,
    from: process.env.SENDER_EMAIL,
    subject: "Action Required: Verify Your Email Address",
    templateId: EMAIL_TEMPLATES.verification,
    dynamic_template_data: {
      name: name,
      url: `${process.env.FRONTEND_URL}/email-verification/${token}`,
      subject: "Action Required: Verify Your Email Address",
    },
  };
  await sgMail
    .send(msg)
    .then(() => {
      logger.info("Email sent");
    })
    .catch((error) => {
      logger.error({
        message: `An error occurred ${error.message}`,
        error: error,
      });
    });
};

module.exports = {
  sendVerificationEmail,
};
