const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const {
  body,
  validateRequestBody,
  validationResult,
} = require("../utils/validator");

// Create a checkout session for a new subscription
// Payload: { "token": "user-auth-token", "subscription_type": "basic/premium/etc.", "referral_code": "optional" }
// Use Case: To create a checkout session for the user to start a new subscription.
router
  .route("/create-checkout-session")
  .post(
    validateRequestBody([
      body("user_id").notEmpty().withMessage("UserId is required"),
      body("subscription_type")
        .notEmpty()
        .withMessage("Subscription Type is required"),
    ]),
    function (req, res) {
      const result = paymentController.createCheckoutSession(req, res);
      return result;
    }
  );

// Update the payment method for a user
// Payload: { "user_id": 123 }
// Use Case: To update the payment method for the user.
router
  .route("/update-payment-method")
  .post(
    validateRequestBody([
      body("user_id").isInt().withMessage("UserId should be an integer"),
    ]),
    function (req, res) {
      const result = paymentController.updatePaymentMethod(req, res);
      return result;
    }
  );

// Update the subscription type for a user
// Payload: { "user_id": 123, "subscription_type": "basic/premium/etc." }
// Use Case: To upgrade or downgrade the user's subscription type.
router
  .route("/update-subscription")
  .post(
    validateRequestBody([
      body("user_id").isInt().withMessage("UserId should be an integer"),
      body("subscription_type")
        .notEmpty()
        .withMessage("Subscription Type is required"),
    ]),
    function (req, res) {
      const result = paymentController.updateSubscription(req, res);
      return result;
    }
  );

// Cancel the user's subscription at the end of the billing period
// Payload: { "user_id": 123 }
// Use Case: To cancel the user's subscription at the end of the current billing period.
router.route("/cancel-subscription").post(function (req, res) {
  const result = paymentController.cancelSubscription(req, res);
  return result;
});

// Check the payment status for a user
// Payload: { "user_id": 123 }
// Use Case: To check the current payment status for the user.
router.route("/check-payment-status").post(function (req, res) {
  const result = paymentController.checkPaymentStatus(req, res);
  return result;
});

// Get the billing information for a user
// Payload: { "user_id": 123 }
// Use Case: To retrieve the billing information for the user.
router.route("/billing-info").post(function (req, res) {
  const result = paymentController.getBillingInfo(req, res);
  return result;
});

// Create a verification token
// Payload: { "some_data": "value" }
// Use Case: To create a verification token for the user.
router.route("/create-token").post(function (req, res) {
  const result = paymentController.createVerificationToken(req, res);
  return result;
});

// Verify a token
// Payload: { "verificationToken": "some-token" }
// Use Case: To verify a token and return the decoded token information.
router.route("/verify-token").post(function (req, res) {
  const result = paymentController.verifyToken(req, res);
  return result;
});

// Get the customer invoices for a user
// Payload: { "user_id": 123 }
// Use Case: To retrieve the invoices for the user.
router.route("/customer-invoice").post(function (req, res) {
  const result = paymentController.getCustomerInvoices(req, res);
  return result;
});

// Get the plan details for a user
// Payload: { "user_id": 123 }
// Use Case: To retrieve the current subscription plan details for the user.
router.route("/plan-details").post(function (req, res) {
  const result = paymentController.getPlanDetails(req, res);
  return result;
});

// Get the prorated charge for upgrading a subscription
// Payload: { "user_id": 123, "new_subscription": "premium/etc." }
// Use Case: To calculate the prorated charge when upgrading the user's subscription.
router.route("/get-prorated-cost").post(function (req, res) {
  const result = paymentController.getProratedCharge(req, res);
  return result;
});

module.exports = router;
