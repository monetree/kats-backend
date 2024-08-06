const logger = require("./logger");

require("dotenv").config();

const convertToLowerCase = (originalString) => {
  return originalString.toLowerCase().replace(/\s+/g, "-");
};

const unixToDate = (unixTimestamp) => {
  const date = new Date(unixTimestamp * 1000);
  return date;
};

const currentUnixDate = () => {
  const now = new Date();
  const unixTimestamp = now.getTime();
  const unixTimestampInSeconds = Math.floor(unixTimestamp / 1000);
  return unixTimestampInSeconds;
};

const handleErrorResponse = (res, error) => {
  logger.error({
    message: `An error occurred ${error.message}`,
    error: error,
  });
  return res.status(500).json({ error: "Internal server error" });
};

const sendErrorResponse = (res, message, statusCode = 400) => {
  logger.error({
    message: `An error occurred ${message}`,
  });
  return res.status(statusCode).json({ error: message });
};

const subscriptionPrices = {
  pro: process.env.PRO_PRICE_ID,
  ultimate: process.env.ULTIMATE_PRICE_ID,
  beginner: process.env.BEGINNER_PRICE_ID,
};

const subscriptionPlanCost = {
  pro: 89,
  ultimate: 99,
  beginner: 35,
};

const lomsByPlan = {
  pro: 3,
  ultimate: 100,
  beginner: 1,
};

const conditionMapping = {
  Acne: "acne",
  Anxiety: "anxiety",
  Arthritis: "arthritis",
  "Autoimmune Disease": "autoimmune_disease",
  Cancer: "cancer",
  "Chronic Fatigue": "chronic_fatigue",
  "Chronic Pain": "chronic_pain",
  Dementia: "dementia",
  Depression: "depression",
  "Fatty Liver Disease": "fatty_liver_disease",
  "Heart Disease": "heart_disease",
  "High blood pressure": "high_blood_pressure",
  "High blood pressure": "high_blood_pressure_hypertension",
  "High cholesterol": "high_cholesterol",
  "High blood glucose": "high_blood_glucose",
  "Kidney Disease": "kidney_disease",
  Migraines: "migraines",
  Obesity: "obesity",
  "Pre-Diabetes": "pre_diabetes",
  Stroke: "stroke",
  "Type 2 Diabetes": "type_2_diabetes",
};

const healthConditionNames = [
  "Acne",
  "Anxiety",
  "Arthritis",
  "Autoimmune Disease",
  "Cancer",
  "Chronic Fatigue",
  "Chronic Pain",
  "Dementia",
  "Depression",
  "Fatty Liver Disease",
  "Heart Disease",
  "High blood pressure",
  "High cholesterol",
  "High blood glucose",
  "Kidney Disease",
  "Migraines",
  "Obesity",
  "Pre-Diabetes",
  "Stroke",
  "Type 2 Diabetes",
];

function getDateAfterNthMonth(months = 12) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months start at 0!
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return mm + "/" + dd + "/" + yyyy;
}

function getCurrentDate() {
  const date = new Date();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months start at 0!
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return mm + "/" + dd + "/" + yyyy;
}

const getReferealAmount = async () => {
  const [config] = await knex("configs").select("referral_enabled", "free_tier_enabled", "referral_amount", "id")
  return config.referral_amount
};

module.exports = {
  convertToLowerCase,
  unixToDate,
  currentUnixDate,
  handleErrorResponse,
  sendErrorResponse,
  subscriptionPrices,
  lomsByPlan,
  conditionMapping,
  healthConditionNames,
  getDateAfterNthMonth,
  subscriptionPlanCost,
  getCurrentDate,
  getReferealAmount,
};
