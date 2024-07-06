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
      apple_id,
      username,
      first_name,
      last_name,
      provider_id,
      provider_name,
      token,
      is_email_login = false,
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (is_email_login) {
      const { firstName, lastName } = extractNamesFromEmail(email);
      await knex("users").insert({
        email,
        username: firstName,
        first_name: firstName,
        last_name: lastName,
        unique_id: uuidv4(),
      });
      await sendVerificationEmail(firstName, email, newUser);
    }

    // Check if email or apple_id already exists
    const existingUser = await knex("users")
      .where({ email })
      .orWhere({ apple_id })
      .first();

    if (existingUser) {
      res.status(200).json(existingUser);
    }

    // Insert new user if email or apple_id does not exist
    const [newUser] = await knex("users").insert({
      email,
      apple_id,
      username,
      first_name,
      last_name,
      provider_id,
      provider_name,
      token,
      unique_id: uuidv4(),
    });

    const createdUser = await knex("users").where({ id: newUser }).first();
    res.status(201).json(createdUser);
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
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await knex("users").where({ id }).del();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  loginUser,
  updateUser,
  deleteUser,
  checkStatus,
};
