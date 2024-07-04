const { knex } = require("../db/connection");

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
    } = req.body;

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
};
