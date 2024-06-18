require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const {
  getAdminEmails,
  storyProgressEmails,
  emailTemplates,
} = require("./configs");
const logger = require("./logger");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const ADMIN_EMAILS = getAdminEmails();
const STORY_PROGRESS_EMAILS = storyProgressEmails();

const sendTestEmail = async (email) => {
  const msg = {
    to: email,
    from: process.env.SUPPORT_EMAIL,
    subject: "Welcome to Potential AI",
    templateId: "d-c05e8dc903fd4c34a48d42d5a501c879",
    dynamic_template_data: {},
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

const sendPartnershipEmail = async (
  email,
  url,
  first_name,
  last_name,
  firm_name,
  firm_type,
  firm_location,
  other_details
) => {
  const msg = {
    to: ADMIN_EMAILS,
    from: process.env.SUPPORT_EMAIL,
    subject: "New Potential AI Partnerships Submission",
    templateId: "d-585a33e9fa074572ac61423ecdc42e22",
    dynamic_template_data: {
      email: email,
      url: url,
      first_name: first_name,
      last_name: last_name,
      firm_name: firm_name,
      firm_type: firm_type,
      firm_location: firm_location,
      other_details: other_details,
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

const sendEmail = async (name, email, token) => {
  const msg = {
    to: email,
    from: process.env.RACHEL_EMAIL,
    subject: "Welcome to Potential AI",
    templateId: "d-c05e8dc903fd4c34a48d42d5a501c879",
    dynamic_template_data: {
      name: name,
      url: `${process.env.FRONTEND_URL}`,
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

const sendPasswordResetEmail = async (email, url) => {
  const msg = {
    to: email,
    from: process.env.SUPPORT_EMAIL,
    subject: "Reset Your - Password",
    templateId: "d-c2df90e3c9244edab7fc1abb0c4fa5df",
    dynamic_template_data: {
      url: url,
    },
  };
  await sgMail
    .send(msg)
    .then(() => {
      logger.info("Password reset sent");
    })
    .catch((error) => {
      logger.error({
        message: `An error occurred ${error.message}`,
        error: error,
      });
    });
};

const sendStorySubmissionEmail = async (
  company,
  version,
  url,
  first_name,
  last_name,
  story
) => {
  const subject = `${
    first_name.charAt(0).toUpperCase() + first_name.slice(1)
  } ${last_name.charAt(0).toUpperCase() + last_name.slice(1)} | ${
    company.charAt(0).toUpperCase() + company.slice(1)
  } | ${story.charAt(0).toUpperCase() + story.slice(1)} | ${version}`;
  const msg = {
    to: ADMIN_EMAILS,
    from: process.env.SENDER_EMAIL,
    subject: subject,
    templateId: "d-afac763560bc46129e9b41a3f6e2a704",
    dynamic_template_data: {
      url,
      subject,
      first_name,
      last_name,
      story,
    },
  };
  await sgMail
    .send(msg)
    .then(() => {
      logger.info("Story submission mail sent!");
    })
    .catch((error) => {
      logger.error({
        message: `An error occurred ${error.message}`,
        error: error,
      });
    });
};

const sendStoryRevisionEmail = async (
  email,
  story,
  name,
  user_id,
  token,
  template,
  version
) => {
  const msg = {
    to: email,
    from: process.env.SUPPORT_EMAIL,
    subject: `Your ${story} is Ready for Review!`,
    templateId: STORY_PROGRESS_EMAILS[template],
    dynamic_template_data: {
      subject: `Your ${story
        .toLowerCase() // convert the string to lowercase
        .split("_") // split the string by underscore
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize the first letter of each word
        .join(" ")} is Ready for Review!`,
      version: version,
      story: story.toLowerCase().replace("_", " "),
      name: name,
      url: `${process.env.FRONTEND_URL}/dashboard/${story
        .toLowerCase()
        .replace("_", "-")}/${user_id}/?token=${token}`,
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

const sendInviteEmail = async (email, name, token, version = 1) => {
  const onboardingEmail = emailTemplates();
  const msg = {
    to: email,
    from: process.env.RACHEL_EMAIL,
    subject: `Congratulations, You've Been Selected for Early Access to Potential AI!`,
    templateId:
      version === 1
        ? onboardingEmail.ON_BOARDING_V1
        : version === 2
        ? onboardingEmail.ON_BOARDING_V2
        : version === 3
        ? onboardingEmail.ON_BOARDING_V3
        : onboardingEmail.ON_BOARDING_V4,
    dynamic_template_data: {
      name: name,
      url: `${process.env.FRONTEND_URL}/create-account/${token}/`,
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

const sendRegisterEmail = async (name, email, linkedin) => {
  const msg = {
    to: ADMIN_EMAILS,
    from: process.env.SUPPORT_EMAIL,
    subject: `New Potential AI Waitlist Submission`,
    templateId: "d-e24da6aebad747f8972539595e6f3e19",
    dynamic_template_data: {
      name: name,
      email: email,
      linkedin: linkedin,
      url: `${process.env.ADMIN_URL}`,
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

const sendSubscriptionCancellationEmail = async (
  email,
  first_name,
  last_name,
  date
) => {
  const msg = {
    to: email,
    from: process.env.SENDER_EMAIL,
    subject: `Potential AI Subscription Cancellation Confirmation`,
    templateId: "d-53ef79e175d74559afd153f141be420a",
    dynamic_template_data: {
      name: `${first_name} ${last_name}`,
      date: date,
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

const sendInvoiceFailedEmail = async (email, name, url, message) => {
  const msg = {
    to: email,
    from: process.env.SENDER_EMAIL,
    subject: `Potential AI Subscription Cancellation Confirmation`,
    templateId: "d-e7a0049f104345b1b4a3dee7de85632c",
    dynamic_template_data: {
      name: name,
      url: url,
      message: message,
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

const sendSubscriptionPlanChange = async (
  product_name,
  email,
  name,
  interval,
  month,
  old_price,
  new_price
) => {
  const msg = {
    to: email,
    from: process.env.SENDER_EMAIL,
    subject: `Important Update to Your Subscription Pricing`,
    templateId: "d-1b7f639b898e486a82fc459d52776e71",
    dynamic_template_data: {
      product_name,
      name,
      interval,
      month,
      old_price,
      new_price,
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

const sendOtp = async (email, first_name, otp) => {
  const msg = {
    to: email,
    from: process.env.SENDER_EMAIL,
    subject: `Verification Code to Change Your Email on Potential AI`,
    templateId: "d-68c115c795d14c9d808bc2dc764a29af",
    dynamic_template_data: {
      first_name,
      otp,
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

const sendPaymentReminder = async (
  email,
  price,
  frequency,
  amount,
  name,
  date
) => {
  const subject = `Your Potential AI upcoming renewal on ${date}`;
  const msg = {
    to: email,
    from: process.env.SUPPORT_EMAIL,
    subject: subject,
    templateId: "d-a33659249f13416182d3c89733a3483c",
    dynamic_template_data: {
      price,
      frequency,
      amount,
      name,
      date,
      subject,
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

const sendGptFailureMail = async (email, message) => {
  const msg = {
    to: email,
    from: process.env.SUPPORT_EMAIL,
    subject: "Failed To Create Transcript",
    text: message,
    html: `<strong>${message}</strong>`,
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

const inviteMemberEmail = async (email, url, name, company) => {
  const subject = `Action required: ${name} invited you to join ${company} in Potential AI`;
  const msg = {
    to: email, // Member email
    from: process.env.SUPPORT_EMAIL,
    subject: subject,
    templateId: "d-48224279a74f41ff914197f6d253cfd4",
    dynamic_template_data: {
      url,
      subject,
      name,
      company,
    },
  };
  await sgMail
    .send(msg)
    .then(() => {
      logger.info("Invite member mail sent!");
    })
    .catch((error) => {
      logger.error({
        message: `An error occurred ${error.message}`,
        error: error,
      });
    });
};

const sendWaitlistEmail = async (email, name, url) => {
  const subject = `Thanks for signing up for the Potential AI waitlist`;
  const msg = {
    to: email, // Member email
    from: process.env.RACHEL_EMAIL,
    subject: subject,
    templateId: "d-72e72873c4714a01925d2d8ca8f7aae8",
    dynamic_template_data: {
      url,
      subject,
      name,
    },
  };
  await sgMail
    .send(msg)
    .then(() => {
      logger.info("Waitlist mail sent!");
    })
    .catch((error) => {
      logger.error({
        message: `An error occurred ${error.message}`,
        error: error,
      });
    });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendStorySubmissionEmail,
  sendStoryRevisionEmail,
  sendInviteEmail,
  sendRegisterEmail,
  sendTestEmail,
  sendSubscriptionCancellationEmail,
  sendInvoiceFailedEmail,
  sendSubscriptionPlanChange,
  sendPartnershipEmail,
  sendOtp,
  sendPaymentReminder,
  sendGptFailureMail,
  inviteMemberEmail,
  sendWaitlistEmail,
};
