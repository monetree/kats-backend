require("dotenv").config();

const { knex } = require("../db/connection");
const hash = require("../utils/hash");
const sendgrid = require("../utils/email");
const { updateAirtableClickedEvent } = require("../workers/tasks");

const fetchUserByEmail = async (email) => {
  const [user] = await knex.select("*").from("users").where({ email });
  return user;
};

const checkAccountReadiness = async (user) => {
  const profileCount = await countProfilesForUser(user.id);
  const payment = await fetchPaymentForUser(user.id);
  return user.status === "Active" && profileCount > 0 && payment;
};

const countProfilesForUser = async (user_id) => {
  const [profile] = await knex("profiles")
    .where({ user_id })
    .count("* as count");
  return profile.count;
};

const fetchPaymentForUser = async (user_id) => {
  let [payment] = await knex("payments")
    .where({ user_id })
    .whereIn("status", ["active", "cancelled"]);

  if (!payment) {
    const member = await fetchMemberForUser(user_id);
    if (member) {
      const [ownerPayment] = await knex("payments")
        .where({ user_id: member.user_id })
        .whereIn("status", ["active", "cancelled"]);
      if (ownerPayment) {
        [payment] = await knex("payments")
          .where({ user_id: ownerPayment.user_id })
          .whereIn("status", ["active", "cancelled"]);
      }
    }
  }
  return payment;
};

const fetchMemberForUser = async (user_id) => {
  const [member] = await knex("member").where({
    member_id: user_id,
    disabled: false,
  });
  return member;
};

const updateUserToken = async (user) => {
  const token = hash.createToken({ user_id: user.id }, "12d");
  await knex("users").where({ id: user.id }).update({ token });
  return token;
};

const fetchUser = async (user_id) => {
  const [user] = await knex("users").where({ id: user_id });
  return user;
};

const compileUserStatusResult = (profile, payment, user) => {
  return {
    payment: !!payment,
    profile: !!profile,
    user: { ...profile, email: user.email, company: profile?.company_name },
  };
};

const fetchUserRoles = async (user_id) => {
  return await knex.select("*").from("roles").where({ user_id });
};

const fetchUserIndustries = async (user_id) => {
  return await knex.select("*").from("industries").where({ user_id });
};

const fetchUserFundingRound = async (user_id) => {
  const [funding_round] = await knex
    .select("*")
    .from("funding_rounds")
    .where({ user_id });
  return funding_round;
};

const fetchAdminByEmail = async (email) => {
  const [admin] = await knex.select("*").from("admin").where({ email });
  return admin;
};

const validateAdminPassword = async (password, admin) => {
  return hash.checkPassword(password, admin.password);
};

const updateAdminToken = async (admin) => {
  const token = hash.createToken({ user_id: admin.id }, "1d");
  await knex("admin").where({ id: admin.id }).update({ token });
  return token;
};

const checkUserExists = async (email) => {
  const [user] = await knex.select("*").from("users").where({ email });
  return !!user;
};

const addUser = async (userData) => {
  const plainPassword = hash.randomPassword();
  const encryptedPassword = hash.generatePasswordHash(plainPassword);
  const [userId] = await knex("users").insert({
    ...userData,
    password: encryptedPassword,
  });
  return userId;
};

const addFundraising = async (fundraisingData) => {
  const [fundraisingId] = await knex("fundraising").insert(fundraisingData);
  return fundraisingId;
};

const validatePartnerCode = async (partner_code, referral, is_member) => {
  if (referral) {
    // Logic to check if the referral code exists
    const [referralUser] = await knex("users")
      .where({ referral_code: partner_code })
      .select("id");
    if (!referralUser) {
      throw new Error("Invalid referral code");
    }
  } else if (is_member) {
    return true;
  } else {
    // Logic to check if the partner code exists
    const [partnerData] = await knex("partner")
      .where({ partner_code })
      .select("id");
    if (!partnerData) {
      throw new Error("Invalid partner code");
    }
  }
};

const addPremiumUser = async (userData) => {
  // Check if the user with the provided email exists
  const existingUser = await knex("users")
    .where({ email: userData.email })
    .first();

  if (existingUser) {
    // User with this email already exists, update the user's fields (excluding email)
    await knex("users")
      .where({ email: userData.email })
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        linkedin: userData.linkedin,
        password: hash.generatePasswordHash(userData.password), // You can update the password if needed
        is_premium: true, // You can update other fields as needed
      });

    // Return the userId of the updated user
    return existingUser.id;
  } else {
    // User with this email does not exist, create a new user
    const encryptedPassword = hash.generatePasswordHash(userData.password);
    const [userId] = await knex("users").insert({
      ...userData,
      password: encryptedPassword,
      is_premium: true,
    });

    // Return the userId of the newly created user
    return userId;
  }
};

const assignTokenToUser = async (userId, referral, partner_code) => {
  let token;
  if (referral) {
    token = hash.createToken(
      { user_id: userId, referral_code: partner_code },
      "7d"
    );
  } else {
    token = hash.createToken(
      { user_id: userId, partner_code: partner_code },
      "7d"
    );
  }
  await knex("users").where({ id: userId }).update({ token });
  return token;
};

const postUserCreationTasks = async (userId, referral, partner_code, email) => {
  if (referral) {
    const [referred_user] = await knex("users")
      .where({ referral_code: partner_code })
      .select("id");
    if (referred_user) {
      const exists = await knex("referral")
        .where({ user_id: referred_user.id, refer_id: userId })
        .first();
      if (!exists) {
        await knex("referral").insert({
          user_id: referred_user.id,
          refer_id: userId,
        });
      }
    }
  }

  const [member] = await knex("member")
    .where({ email })
    .andWhere({ disabled: false });
  if (member) {
    await knex("member").where({ email }).update({ member_id: userId });
    await knex("users").where({ id: userId }).update({ status: "Active" });
  }
};

const createAndUpdateTokenForUser = async (user_id) => {
  const newToken = hash.createToken({ user_id }, "1d");
  await knex("users").where({ id: user_id }).update({ token: newToken });
  return newToken;
};

const decodeAndValidateToken = (token) => {
  const user = hash.decodeToken(token);
  return user?.user_id ? user : null;
};

const handleUserToken = async (user, res) => {
  const [userData] = await knex("users").where({ id: user.user_id });
  updateAirtableClickedEvent(userData.email);
  return res.json({
    user,
    token_type: "user",
    is_member: user.is_member,
  });
};

const handleNonUserToken = async (token, res) => {
  const partner = await knex("partner").where({ partner_code: token }).first();
  if (partner) {
    return res.json({ partner, token_type: "partner" });
  }

  const referralCode = await knex("users")
    .where({ referral_code: token })
    .select("referral_code")
    .first();
  if (referralCode) {
    return res.json({
      referral_code: referralCode.referral_code,
      token_type: "referral",
    });
  }

  return res.status(400).json({ error: "Invalid token" });
};

const checkUserPassword = (password, user) => {
  return hash.checkPassword(password, user.password);
};

const deleteExistingTempRecords = async (user_id, email) => {
  await knex("temp").where({ user_id, email }).del();
};

const createTempRecord = async (user_id, email, otp) => {
  await knex("temp").insert({ user_id, otp, email });
};

const processEmailChange = async (user, newEmail) => {
  const otp = hash.generateOTP();
  await deleteExistingTempRecords(user.id, newEmail);
  await createTempRecord(user.id, newEmail, otp);
  await sendgrid.sendOtp(newEmail, user.first_name, otp);
};

const applyFilter = (query, field, value) => {
  if (field && value) {
    query.where(field, value);
  }
};

const applySorting = (query, field, type) => {
  if (field) {
    query.orderBy(field, type || "asc");
  }
};

const fetchUsers = async (filterField, filterValue, sortField, sortType) => {
  const query = knex
    .select(
      "id",
      "email",
      "first_name",
      "last_name",
      "created_at",
      "linkedin",
      "status",
      "role"
    )
    .from("users");

  applyFilter(query, filterField, filterValue);
  applySorting(query, sortField, sortType);

  return await query;
};

module.exports = {
  fetchUsers,
  processEmailChange,
  checkUserPassword,
  fetchUserByEmail,
  checkAccountReadiness,
  updateUserToken,
  fetchUser,
  compileUserStatusResult,
  fetchUserRoles,
  fetchUserIndustries,
  fetchUserFundingRound,
  fetchAdminByEmail,
  validateAdminPassword,
  updateAdminToken,
  checkUserExists,
  addUser,
  validatePartnerCode,
  addPremiumUser,
  assignTokenToUser,
  postUserCreationTasks,
  createAndUpdateTokenForUser,
  decodeAndValidateToken,
  handleUserToken,
  handleNonUserToken,
  addFundraising,
};
