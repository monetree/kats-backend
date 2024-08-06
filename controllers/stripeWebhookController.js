const { knex } = require("../db/connection");
const logger = require("../utils/logger");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const {
  processSessionCompletion,
  validateEvent,
  processSubscriptionDeletion,
  updateCustomerPaymentMethod,
  updateLocalDatabase,
  getUserInfo,
  addPdfToUrl,
  getPaymentInfo,
  insertTransactionHistory,
  getUserBySubscriptionId,
} = require("../helpers/paymentHelper");
// const { sendTemplateEmail } = require("../utils/ses/aws_email");


const checkoutSessionCompleted = async (req, res) => {
  try {
    const event = await validateEvent(
      req,
      process.env.STRIPE_CHECKOUT_SESSION_COMPLETED_WEBHOOK_SECRET
    );
    const data = event.data.object;
    const metadata = data.metadata;
    const user_id = metadata.user_id;
    const referral_code = metadata.referral_code;
    const charge_type = metadata.charge_type;
    const subscription_type = metadata.subscription_type;
    const invoiceId = data.invoice;

    if (event.type !== "checkout.session.completed" || !user_id) {
      return res.send({ status: "event not received or user_id missing" });
    }

    // Retrieve the invoice
    const invoice = await stripe.invoices.retrieve(invoiceId);
    const invoicePdfUrl = invoice.invoice_pdf;

    // Retrieve the charge associated with the invoice
    const chargeId = invoice.charge;
    const charge = await stripe.charges.retrieve(chargeId);
    const receiptUrl = charge.receipt_url;
    const receiptPdfUrl = addPdfToUrl(receiptUrl);
   
    await processSessionCompletion(
      data,
      user_id,
      invoiceId,
      charge_type,
      subscription_type,
      invoicePdfUrl,
      receiptPdfUrl,
      referral_code
    );

    res.send({ status: "success" });
  } catch (error) {
    console.log("Error: ", error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};




const customerSubscriptionUpdated = async (req, res) => {
  try {
    const event = await validateEvent(
      req,
      process.env.STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_WEBHOOK_SECRET
    );

    if (event.type !== "customer.subscription.updated") {
      return res.send({ status: "event not received" });
    }

    const data = event.data.object;
    const subscription_id = data.id;
    const user_id = await getUserBySubscriptionId(subscription_id);

    // Fetch the latest invoice for the subscription
    const latestInvoice = await stripe.invoices.retrieve(data.latest_invoice);
    const invoicePdfUrl = latestInvoice.invoice_pdf;

    console.log("invoicePdfUrl", invoicePdfUrl);

    const chargeId = latestInvoice.charge;
    let receiptPdfUrl = null;
    let amount = 0;
    if (chargeId) {
      const charge = await stripe.charges.retrieve(chargeId);
      receiptPdfUrl = addPdfToUrl(charge.receipt_url);
      amount = charge.amount / 100;
    }

    const user = await getUserInfo(user_id);
    const payment = await getPaymentInfo(user_id);

    // if(payment.subscription_type !== "beginner") {
    //   await sendTemplateEmail("planUpgradeTemplate", user.email, {
    //     name: user.full_name,
    //     plan: `${payment.subscription_type} Saver`
    //   });
    // }

    await insertTransactionHistory(
      user_id,
      payment.id,
      amount,
      event.created,
      invoicePdfUrl,
      receiptPdfUrl
    );

    res.send({ status: "success" });
  } catch (error) {
    logger.error({
      message: `An error occurred: ${error.message}`,
      error: error,
    });
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};



const customerSubscriptionDeleted = async (req, res) => {
  try {
    const event = await validateEvent(
      req,
      process.env.STRIPE_CUSTOMER_SUBSCRIPTION_DELETED_WEBHOOK_SECRET
    );

    if (event.type !== "customer.subscription.deleted") {
      return res.send({ status: "event not received" });
    }

    const data = event.data.object;
    const created = event.data.created;
    const customer_id = data.customer;
    const subscription_id = data.id;
    const status = data.status;

    await processSubscriptionDeletion(
      customer_id,
      subscription_id,
      status,
      created
    );

    res.send({ status: "success" });
  } catch (error) {
    logger.error({
      message: `An error occurred ${error.message}`,
      error: error,
    });
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

const billingMethodUpdated = async (req, res) => {
  try {
    const event = await validateEvent(
      req,
      process.env.STRIPE_SETUP_INTENT_SUCCEEDED_WEBHOOK_SECRET
    );

    if (event.type !== "setup_intent.succeeded") {
      return res.send({ status: "event not received" });
    }

    const setupIntent = event.data.object;
    const paymentMethodId = setupIntent.payment_method;
    const metadata = setupIntent.metadata;
    const userId = metadata.user_id;

    const [paymentRecord] = await knex("payments").where({ user_id: userId });
    if (!paymentRecord) {
      throw new Error("Associated payment record not found");
    }
    const customerId = paymentRecord.customer_id;

    await updateCustomerPaymentMethod(customerId, paymentMethodId);
    await updateLocalDatabase(userId, paymentMethodId);

    res.send({ status: "success" });
  } catch (error) {
    logger.error({
      message: `An error occurred ${error.message}`,
      error: error,
    });
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

const chargeFailed = async (req, res) => {
  try {
    const event = await validateEvent(
      req,
      process.env.STRIPE_CHARGE_FAILED_WEBHOOK_SECRET
    );

    if (event.type !== "payment_intent.payment_failed") {
      return res.send({ status: "event not received" });
    }

    const data = event.data.object;
    const metadata = data.metadata;
    const last_payment_error = data.last_payment_error.message;
    const user_id = metadata.user_id;

    const cardLast4 = data?.last_payment_error?.payment_method?.card?.last4;
    const cardBrand = data?.last_payment_error?.payment_method?.card?.brand;

    try {
      const user = getUserInfo(user_id);
      // await sendFailureNotification(user, cardLast4, cardBrand);
      res.send({ message: last_payment_error, email: user.email });
    } catch (error) {
      return res.status(404).send({ error: error.message });
    }
  } catch (error) {
    logger.error({
      message: `An error occurred ${error.message}`,
      error: error,
    });
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

module.exports = {
  checkoutSessionCompleted,
  customerSubscriptionDeleted,
  billingMethodUpdated,
  chargeFailed,
  customerSubscriptionUpdated,
};
