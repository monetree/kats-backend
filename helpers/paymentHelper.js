const { knex } = require("../db/connection");
const {
  lomsByPlan,
  getReferealAmount,
} = require("../utils/configs");
const { decodeToken } = require("../utils/hash");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Function to retrieve payment information
const getPaymentInfo = async (user_id) => {
  const [payment] = await knex("payments").where({ user_id });
  return payment;
};


// Function to retrieve user information
const getUserInfo = async (user_id) => {
  const userWithSubscription = await knex("users")
    .select("users.*", "payments.subscription_type")
    .leftJoin("payments", "users.id", "payments.user_id")
    .where("users.id", user_id)
    .first();
    
  if (!userWithSubscription) {
    throw new Error("User not found");
  }

  return userWithSubscription;
};

async function fetchBillingInfo(user_id) {
  const [billing] = await knex(`billing_info`).where({ user_id });
  return billing;
}

// Function to decode and validate token
const decodeAndValidateToken = (token) => {
  const decodedToken = decodeToken(token);
  if (!decodedToken) {
    throw new Error("Invalid token");
  }
  return decodedToken;
};

// Function to create Stripe customer
const createStripeCustomer = async (user) => {
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.first_name} ${user.last_name}`,
    metadata: { user_id: user.id },
  });
  return customer;
};

const chargeCustomer = async (
  paymentMethodId,
  amount,
  currency,
  customerId
) => {
  // Create a PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount, // Amount to charge (in smallest currency unit, e.g., cents for USD)
    currency: currency, // Currency
    customer: customerId, // Optional: if you have a Stripe Customer ID, you can specify it here
    payment_method: paymentMethodId, // PaymentMethod ID for the charge
    confirm: true, // Automatically confirm the PaymentIntent
    off_session: true, // Indicates that the customer is not present
  });

  // Getting the created timestamp
  const createdTimestamp = paymentIntent?.created;

  // Returning both the paymentIntent and the created timestamp
  return createdTimestamp;
};

const getUnitAmount = async (user_id) => {
  const [funding_round] = await knex(`funding_rounds`).where({ user_id });
  const stage = funding_round.value;

  const [product] = await knex(`product`).where({
    product_name: funding_round.value,
    payment_type: "Owner",
  });

  const [memberProduct] = await knex(`product`).where({
    product_name: funding_round.value,
    payment_type: "Member",
  });

  return {
    product_id: product.id,
    unit_amount: product.unit_amount,
    member_unit_amount: memberProduct.unit_amount,
    currency: product.currency,
    product_name: product.product_name,
    product_type: product.payment_type,
    funding_round: stage,
  };
};

const insertTransactionHistory = async (
  user_id,
  payment_id,
  amount,
  createdTimestamp,
  invoice_url,
  receipt_url
) => {
  await knex("transaction_history").insert({
    user_id: user_id,
    payment_id: payment_id,
    amount: amount,
    created: createdTimestamp,
    invoice_url,
    receipt_url
  });
};


const insertCoins = async (user_id) => {
  // First, attempt to update the existing record
  const updated = await knex("coins")
    .where({ user_id: user_id })
    .increment('coin', 250)
    .returning('coin'); // Assuming 'coin' is the column you want to update

  // Check if the update was successful
  if (updated.length === 0) {
    // No record was updated, so we insert a new record
    await knex("coins").insert({
      user_id: user_id,
      coin: 250
    });
  }
};

// Function to create Stripe checkout session for payment method update
const createPaymentMethodUpdateSession = async (user_id, customer_id) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "setup",
    customer: customer_id,
    setup_intent_data: {
      metadata: { user_id: user_id, customer_id: customer_id },
    },
    metadata: { id: user_id },
    success_url: `${process.env.MARKETPLACE_URL}/dashboard/info?status=payment_method_update_success`,
    cancel_url: `${process.env.MARKETPLACE_URL}/dashboard/info?status=payment_method_update_failed`,
  });
  return session.url;
};



const getCardDetails = async (paymentMethodId) => {
  try {
    if (!paymentMethodId) {
      return {};
    }
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.type === "card") {
      const cardDetails = {
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
      };
      return cardDetails;
    } else {
      throw new Error("Payment method is not a card.");
    }
  } catch (error) {
    throw error;
  }
};

const retrieveStripeCustomer = async (customer_id) => {
  return await stripe.customers.retrieve(customer_id);
};

const handlePaymentMethodRetrieval = async (res, customer) => {
  const defaultPaymentMethodId =
    customer.invoice_settings.default_payment_method;

  if (defaultPaymentMethodId) {
    const defaultPaymentMethod = await stripe.paymentMethods.retrieve(
      defaultPaymentMethodId
    );
    return res.json(defaultPaymentMethod);
  } else {
    return await retrieveAndSendMostRecentPaymentMethod(res, customer.id);
  }
};

const retrieveAndSendMostRecentPaymentMethod = async (res, customer_id) => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customer_id,
    type: "card",
    limit: 1,
  });

  if (paymentMethods.data.length > 0) {
    return res.json(paymentMethods.data[0]);
  } else {
    return sendErrorResponse(res, 404, "No payment methods found");
  }
};

const getDefaultPaymentMethod = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);

    // Check if the default payment method is set
    const defaultPaymentMethodId =
      customer.invoice_settings.default_payment_method;

    if (defaultPaymentMethodId) {
      return defaultPaymentMethodId;
    } else {
      return null;
    }
  } catch (error) {
    logger.error({
      message: `An error occurred: ${error.message}`,
      error: error,
    });
    return null;
  }
};

const getPaymentMethodId = async (customer_id) => {
  let paymentMethodId = null;
  const defaultPaymentMethodId = await getDefaultPaymentMethod(customer_id);
  if (defaultPaymentMethodId) {
    paymentMethodId = defaultPaymentMethodId;
  }

  if (!paymentMethodId) {
    const paymentMethods = await listPaymentMethods(customer_id);
    if (paymentMethods && paymentMethods.length) {
      paymentMethodId = paymentMethods[0].id;
    }
  }
  return paymentMethodId;
};

const listPaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card", // Assuming you're looking for card payment methods
    });

    return paymentMethods.data;
  } catch (error) {
    logger.error({
      message: `An error occurred: ${error.message}`,
      error: error,
    });
    return null;
  }
};

const createCheckoutSessionForPurchase = async (
  user,
  amount,
  productName,
) => {
  try {
    const customer = await createStripeCustomer(user);
    const payload = {
      customer: customer.id,
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            // Use price_data instead of direct price attributes
            currency: "USD",
            product_data: {
              name: productName, // Specify the product name here
              description: "We accept HSA payments",
            },
            unit_amount: amount, // Specify the amount here
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id
      },
      mode: "payment",
      success_url: `${process.env.MARKETPLACE_URL}/payment-success`,
      cancel_url: `${process.env.MARKETPLACE_URL}/payment-failure`,
      payment_intent_data: {
        setup_future_usage: "off_session", // Note: This is typically used for future payments and might need adjustment based on your use case
      },
    };
    const session = await stripe.checkout.sessions.create(payload);

    return session.url;
  } catch (error) {
    throw error;
  }
};

const createCheckoutSessionForSubscription = async (
  user,
  priceId,
  subscription_type,
  email,
) => {
  try {
    const payload = {
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      line_items: [
        {
          price: priceId, // Ensure this ID corresponds to a Stripe Price object associated with a recurring subscription
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        subscription_type,
      },
      mode: "subscription",

      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failure`,
      customer_email: email, // Autofill the email field
      allow_promotion_codes: true
    };

    const session = await stripe.checkout.sessions.create(payload);
    return session.url;
  } catch (error) {
    throw error;
  }
};

const validateEvent = (req, endpointSecret) => {
  const sig = req.headers["stripe-signature"];
  return stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
};

const retrievePaymentIntentDetails = async (paymentIntentId) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    paymentMethodId: paymentIntent.payment_method,
  };
};

const processSubscriptionDeletion = async (
  customer_id,
  subscription_id,
  status,
  created
) => {
  await knex("payments")
    .where({ customer_id: customer_id, subscription_id: subscription_id })
    .update({
      status: status,
      created: created,
    });
};

const insertPaymentRecord = async (user_id, paymentData, status) => {
  const [paymentId] = await knex("payments").insert({
    user_id: user_id,
    currency: paymentData.currency,
    created: paymentData.created,
    customer_id: paymentData.customer_id,
    subscription_id: paymentData.subscription_id,
    charge_type: paymentData.charge_type,
    subscription_type: paymentData.subscription_type || null,
    status: status,
    payment_method_id: paymentData.paymentMethodId,
  });
  return paymentId;
};

const checkExistingPayment = async (user_id) => {
  return await knex
    .select("*")
    .from("payments")
    .where({ user_id: user_id })
    .first();
};

const insertBillingInfo = async (user_id, customer_details) => {
  await knex("billing_info").insert({
    user_id: user_id,
    email: customer_details.email,
    name: customer_details.name,
    phone: customer_details.phone,
    city: customer_details.address.city,
    country: customer_details.address.country,
    line1: customer_details.address.line1,
    line2: customer_details.address.line2,
    postal_code: customer_details.address.postal_code,
    state: customer_details.address.state,
  });
};

async function getInvoicePaymentIntent(invoiceId) {
  const invoice = await stripe.invoices.retrieve(invoiceId);
  return invoice.payment_intent; // This is the ID of the PaymentIntent
}

const processSessionCompletion = async (
  eventData,
  user_id,
  invoiceId,
  charge_type,
  subscription_type,
  invoice_url,
  receipt_url,
  referral_code
) => {
  const { customer_details } = eventData;
  const existingPayment = await checkExistingPayment(user_id);

  if (existingPayment) {
    throw new Error("Payment already exists for this user.");
  }

  await insertBillingInfo(user_id, customer_details);
  const paymentData = await getPaymentInfo(user_id); // Assuming this function is defined elsewhere

  // Retrieve the payment intent details
  const paymentIntent = await retrievePaymentIntentDetails(
    await getInvoicePaymentIntent(invoiceId)
  );

  if (!paymentData) {
    const amount = eventData.amount_total / 100;

    const paymentId = await insertPaymentRecord(
      user_id,
      {
        amount: amount,
        currency: eventData.currency,
        created: eventData.created,
        customer_id: eventData.customer,
        subscription_id: eventData.subscription,
        cycle: eventData.cycle, // Assuming cycle is part of eventData
        charge_type,
        subscription_type,
        paymentMethodId: paymentIntent.paymentMethodId
      },
      "active"
    );

    await insertTransactionHistory(
      user_id,
      paymentId,
      amount,
      eventData.created,
      invoice_url,
      receipt_url
    );

    await insertCoins(user_id);
  }
};


const updateCustomerPaymentMethod = async (customerId, paymentMethodId) => {
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
};

const updateLocalDatabase = async (userId, paymentMethodId) => {
  await knex("payments")
    .where({ user_id: userId })
    .update({ payment_method_id: paymentMethodId });
};

const sendFailureNotification = async (user, cardLast4, cardBrand) => {
  const msg =
    cardLast4 && cardBrand
      ? `We recently attempted to charge your ${cardBrand} ending in ${cardLast4} for your subscription, but were unsuccessful.`
      : `We recently attempted to charge for your subscription, but were unsuccessful.`;
  const url = `${process.env.FRONTEND_URL}/dashboard/billing`;
  const name = `${user.first_name} ${user.last_name}`;
  const email = user.email;

  await sendgrid.sendInvoiceFailedEmail(email, name, url, msg);
};

const cancelSubscriptionAtPeriodEnd = async (subscriptionId) => {
  const canceledSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      cancel_at_period_end: true,
    }
  );
  return canceledSubscription;
};

const planDetails = async (user_id) => {
  const payment = await knex("payments")
    .select("payments.subscription_type", "payments.subscription_id")
    .where("user_id", user_id)
    .first();

  const subscription = await stripe.subscriptions.retrieve(
    payment.subscription_id
  );
  const currentPeriodEnd = subscription.current_period_end;
  const endingDate = new Date(currentPeriodEnd * 1000);

  payment.lom_count = lomsByPlan[payment.subscription_type];
  payment.ending_date = endingDate;
  return payment;
};


const getSubscriptionId = async (user_id) => {
  const [payment] = await knex(`payments`).where({ user_id });
  return payment.subscription_id;
};

const getSubscriptionItemId = async (subscriptionId) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.items.data.length > 0) {
    const subscriptionItemId = subscription.items.data[0].id;
    return subscriptionItemId;
  } else {
    throw new Error("No subscription items found.");
  }
};




const upgradeSubscription = async (subscriptionId, newPriceId, user_id) => {
  const subscriptionItemId = await getSubscriptionItemId(subscriptionId);

  // Update the subscription item with the new price and create prorations
  const updatedSubscriptionItem = await stripe.subscriptionItems.update(
    subscriptionItemId,
    {
      price: newPriceId,
      proration_behavior: "create_prorations",
    }
  );

  return updatedSubscriptionItem;
};



const upgradeSubscriptionIndb = async (user_id, subscription_type) => {
  return await knex("payments")
    .where({ user_id })
    .update({ subscription_type });
};

module.exports = {
  retrieveStripeCustomer,
  handlePaymentMethodRetrieval,
  retrieveAndSendMostRecentPaymentMethod,
  fetchBillingInfo,
  getPaymentInfo,
  decodeAndValidateToken,
  getUserInfo,
  createStripeCustomer,
  createPaymentMethodUpdateSession,
  getUnitAmount,
  chargeCustomer,
  getCardDetails,
  getPaymentMethodId,
  createCheckoutSessionForPurchase,
  createCheckoutSessionForSubscription,
  insertTransactionHistory,
  validateEvent,
  retrievePaymentIntentDetails,
  processSessionCompletion,
  processSubscriptionDeletion,
  updateCustomerPaymentMethod,
  updateLocalDatabase,
  sendFailureNotification,
  cancelSubscriptionAtPeriodEnd,
  planDetails,
  upgradeSubscription,
  getSubscriptionId,
  upgradeSubscriptionIndb,
};
