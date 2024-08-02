const { knex } = require("../db/connection");
const { v4: uuidv4 } = require("uuid");
const { sendVerificationEmail } = require("../utils/email");

const checkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await knex("users").where({ id }).first();
    res.json({ is_active: user.is_active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function extractNamesFromEmail(email) {
  // Regular expression to match the email structure
  const pattern = /^([a-zA-Z]+)\.([a-zA-Z]+)@/;
  const match = email.match(pattern);

  if (match) {
    let firstName = match[1];
    let lastName = match[2];
    return {
      firstName: firstName,
      lastName: lastName,
    };
  } else {
    return {
      firstName: null,
      lastName: null,
    };
  }
}

const loginUser = async (req, res) => {
  try {
    const {
      email,
      first_name,
      last_name,
      token,
    } = req.body;

    if (!email) {      
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email or apple_id already exists
    const existingUser = await knex("users")
      .where({ email })
      .first();

    if (existingUser) {
      const data = {
        code: 200,
        data : existingUser,
        message: "Login successful!",
        status: "success"
      }
      return res.status(200).json(data);
    }

    // Insert new user if email or apple_id does not exist
    const [newUser] = await knex("users").insert({
      email,
      first_name,
      last_name,
      token,
      unique_id: uuidv4(),
    });

    const createdUser = await knex("users").where({ id: newUser }).first();

    const data = {
      code: 200,
      data : createdUser,
      message: "home data get Successfully!",
      status: "success"
    }
    return res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    // Remove id if it exists in updatedData
    delete updatedData.id;

    await knex("users").where({ id }).update(updatedData);
    const user = await knex("users").where({ id }).first();

    const data = {
      code: 200,
      data : user,
      message: "User updated successful!",
      status: "success"
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await knex("users").where({ id }).del();
    const data = {
      code: 204,
      message: "Account deleted successful!",
      status: "success"
    }

    res.status(204).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMesages = async (req, res) => {
  try {
    const { user_id, avatar_id } = req.body;
    const data = await knex("conversations").where({ user_id: user_id, avatar_id: avatar_id });
    const result = {
      code: 200,
      message: "Account deleted successful!",
      status: "success",
      data: data
    }

    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getRecentChats = async (req, res) => {
  try {
    const { user_id } = req.body;

    const data = await knex("conversations")
      .where({ user_id: user_id })
      .distinct('avatar_id')
      .join('avatars', 'conversations.avatar_id', 'avatars.id')
      .select('avatars.*');

    const result = {
      code: 200,
      message: "Unique avatars retrieved successfully!",
      status: "success",
      data: data
    }

    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const createCoins = async (req, res) => {
  try {
    const { user_id } = req.query;

    const user = await knex("coins").where({ user_id: user_id }).first();
    if(user){
      await knex("coins").where({ user_id: user_id }).update({ coin: user.coin + 100 });
    } else {
      await knex("coins").insert({ user_id: user_id, coin: 100 });
    }

    const result = {
      code: 200,
      message: "coins addedd"
    }

    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const fetchCoins = async (req, res) => {
  try {
    const { user_id } = req.query;

    const user = await knex("coins").where({ user_id: user_id }).first();
    const result = {
      code: 200,
      message: "coins fetched",
      data: user ? {coin: user.coin } : { coin: 0 }
    }

    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



module.exports = {
  loginUser,
  updateUser,
  deleteUser,
  checkStatus,
  getMesages,
  getRecentChats,
  createCoins,
  fetchCoins
};
