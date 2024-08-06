const express = require("express");
const router = express.Router();
const stripeWebhookController = require("../controllers/stripeWebhookController");
const typeformWebhookController = require("../controllers/typeformWebhookController");

// Stripe webhook for checkout session completion
// Payload: Stripe event data for 'checkout.session.completed'
// Use Case: To process the completion of a checkout session, retrieve the invoice and charge details, and update the local database with payment information.
router.route("/checkout_session_completed").post(function (req, res) {
  const result = stripeWebhookController.checkoutSessionCompleted(req, res);
  return result;
});

// Stripe webhook for customer subscription creation
// Payload: Stripe event data for 'customer.subscription.created'
// Use Case: To handle the creation of a customer subscription (function not defined in the provided code but typically used to process new subscriptions).
router.route("/customer_subscription_created").post(function (req, res) {
  const result = stripeWebhookController.customerSubscriptionCreated(req, res);
  return result;
});

// Stripe webhook for customer subscription updates
// Payload: Stripe event data for 'customer.subscription.updated'
// Use Case: To process updates to a customer's subscription, including changes to the subscription type or plan.
router.route("/customer_subscription_updated").post(function (req, res) {
  const result = stripeWebhookController.customerSubscriptionUpdated(req, res);
  return result;
});

// Stripe webhook for customer subscription deletion
// Payload: Stripe event data for 'customer.subscription.deleted'
// Use Case: To process the deletion of a customer subscription and update the local database accordingly.
router.route("/customer_subscription_deleted").post(function (req, res) {
  const result = stripeWebhookController.customerSubscriptionDeleted(req, res);
  return result;
});

// Stripe webhook for invoice payment failure
// Payload: Stripe event data for 'invoice.payment_failed'
// Use Case: To handle failed invoice payments and take necessary actions (function not defined in the provided code but typically used to notify users and retry payments).
router.route("/invoice_payment_failed").post(function (req, res) {
  const result = stripeWebhookController.invoicePaymentFailed(req, res);
  return result;
});

// Stripe webhook for charge failure
// Payload: Stripe event data for 'payment_intent.payment_failed'
// Use Case: To handle failed payment intents and notify users about the failure.
router.route("/charge_failed").post(function (req, res) {
  const result = stripeWebhookController.chargeFailed(req, res);
  return result;
});

// Stripe webhook for successful setup intent
// Payload: Stripe event data for 'setup_intent.succeeded'
// Use Case: To update the customer's payment method in Stripe and the local database after a successful setup intent.
router.route("/setup_intent_succeeded").post(function (req, res) {
  const result = stripeWebhookController.billingMethodUpdated(req, res);
  return result;
});


module.exports = router;
