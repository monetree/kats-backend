const {
  getPaymentInfo,
  decodeAndValidateToken,
  getUserInfo,
  createPaymentMethodUpdateSession,
  createCheckoutSessionForSubscription,
  cancelSubscriptionAtPeriodEnd,
  planDetails,
  upgradeSubscription,
  getSubscriptionId,
  upgradeSubscriptionIndb,
} = require("../helpers/paymentHelper");
const { handleErrorResponse, subscriptionPrices } = require("../utils/configs");
const { createToken, decodeToken } = require("../utils/hash");

const createCheckoutSession = async (req, res) => {
  try {
    const {  subscription_type, user_id } = req.body;

    const user = await getUserInfo(user_id);
    const email = user.email;
    
    const url = await createCheckoutSessionForSubscription(
      user,
      subscription_type === "monthly" ? process.env.MONTHLY_PLAN_ID: process.env.YEARLY_PLAN_ID,
      subscription_type,
      email
    );
    return res.json({ url });
  } catch (error) {
    console.log(error);
    handleErrorResponse(res, error);
  }
};

// Example usage

const updatePaymentMethod = async (req, res) => {
  try {
    const { user_id } = req.body;
    const payment = await getPaymentInfo(user_id);
    const sessionUrl = await createPaymentMethodUpdateSession(
      user_id,
      payment.customer_id
    );
    res.json({ url: sessionUrl });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

const updateSubscription = async (req, res) => {
  const { user_id, subscription_type } = req.body;

  try {
    const subscription_id = await getSubscriptionId(user_id);
    const status = await upgradeSubscription(
      subscription_id,
      subscriptionPrices[subscription_type],
      user_id
    );

    await upgradeSubscriptionIndb(user_id, subscription_type);
    res.send({ msg: status });
  } catch (error) {
    console.log(error);
    handleErrorResponse(res, error);
  }
};

const cancelSubscription = async (req, res) => {
  const { user_id } = req.body;

  try {
    const payment = await getPaymentInfo(user_id);
    await cancelSubscriptionAtPeriodEnd(payment.subscription_id);
    res.send({ msg: "success" });
  } catch (error) {
    console.log(error);
    handleErrorResponse(res, error);
  }
};

const createVerificationToken = async (req, res) => {
  try {
    const token = createToken(req.body);
    res.json({ status: "success", token });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

const verifyToken = async (req, res) => {
  try {
    const { verificationToken } = req.body;
    const decodedToken = decodeToken(verificationToken);
    res.json({ status: "success", decodedToken });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

const getPlanDetails = async (req, res) => {
  const { user_id } = req.body;
  try {
    const plan = await planDetails(user_id);

    res.json(plan);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

module.exports = {
  createCheckoutSession,
  cancelSubscription,
  updatePaymentMethod,
  createVerificationToken,
  verifyToken,
  getPlanDetails,
  updateSubscription,
};
