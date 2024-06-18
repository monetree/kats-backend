require("dotenv").config();
const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");

const app = express();
app.use(express.json());
const port = 3000;

// PayPal Environment Setup
function environment() {
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  return new paypal.core.SandboxEnvironment(clientId, clientSecret); // Use Sandbox for testing
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Endpoint to Create QR Payment
app.post("/create-qr-payment", async (req, res) => {
  const { amount, orderId } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: orderId,
        amount: {
          currency_code: "JPY",
          value: amount,
        },
      },
    ],
    application_context: {
      brand_name: "Your Brand Name",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: "https://your-website.com/return",
      cancel_url: "https://your-website.com/cancel",
    },
  });

  try {
    const createResponse = await client().execute(request);
    const qrCodeLink = createResponse.result.links.find(
      (link) => link.rel === "qr_code"
    );

    res.json({
      qrCodeUrl: qrCodeLink.href,
      qrCodeImage: `https://www.paypal.com/qr-code/image/${createResponse.result.id}`,
    });
  } catch (error) {
    console.error("Error creating QR code:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
