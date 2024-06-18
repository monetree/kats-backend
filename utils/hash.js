const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const CryptoJS = require("crypto-js");

const saltRounds = 10;
const SECRET_KEY = "my-super-secret-key";

const generatePasswordHash = (password) => {
  const hash = bcrypt.hashSync(password, saltRounds);
  return hash;
};

const checkPassword = (password, hash) => {
  const match = bcrypt.compareSync(password, hash);
  return match;
};

const generatePartnerString = (length) => {
  const charset = "MNOWXYZcdeflmnoqwxyz0123456789";
  let result = "";
  while (!/[A-Za-z]/.test(result) || !/[0-9]/.test(result)) {
    result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }
  }
  return result;
};

const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return String(otp).padStart(6, "0");
};

const createToken = (data, expiresIn = "12d") => {
  const verificationToken = jwt.sign(
    data,
    SECRET_KEY,
    { expiresIn: expiresIn } // Set token expiration time
  );
  return verificationToken;
};

const decodeToken = (verificationToken) => {
  try {
    const decodedToken = jwt.verify(verificationToken, SECRET_KEY);
    return decodedToken;
  } catch (err) {
    return null;
  }
};

const randomPassword = () => {
  const passwordLength = 10;
  const randomPassword = crypto.randomBytes(passwordLength / 2).toString("hex");
  return randomPassword;
};

const encryptText = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

const decryptText = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = {
  generatePasswordHash,
  checkPassword,
  createToken,
  decodeToken,
  randomPassword,
  generatePartnerString,
  generateOTP,
  encryptText,
  decryptText,
};
