require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const port = 3000;

app.use(bodyParser.json());

// PayPay API credentials from .env file
const API_KEY = process.env.PAYPAY_API_KEY;
const API_SECRET = process.env.PAYPAY_API_SECRET;
const MERCHANT_ID = process.env.PAYPAY_MERCHANT_ID;
const BASE_URL = "https://api.paypay.ne.jp/v2";

// Function to generate Authorization Header
const getAuthHeader = (apiKey, apiSecret) => {
  // Placeholder for generating Authorization header if needed
  // For now, we use apiKey directly in headers
  return `Bearer ${apiKey}`;
};

app.post("/create-qr-code", async (req, res) => {
  const { amount, orderId } = req.body;

  try {
    const response = await axios.post(
      `${BASE_URL}/codes`,
      {
        merchantPaymentId: orderId,
        amount: {
          amount: amount,
          currency: "JPY",
        },
        codeType: "ORDER_QR",
        orderDescription: "Payment for order " + orderId,
        isAuthorization: false,
        redirectUrl: "https://your-website.com/redirect",
        redirectType: "WEB_LINK",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader(API_KEY, API_SECRET),
        },
      }
    );

    res.json({
      qrCodeUrl: response.data.result.qrCodeUrl,
      qrCodeImage: response.data.result.qrCodeImage,
    });
  } catch (error) {
    console.error(
      "Error creating QR code:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to create QR code" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
