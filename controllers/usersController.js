const { knex } = require("../db/connection");

const getUsers = async (req, res) => {
  try {
    const users = await knex("users").select("*");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { mobile, password, first_name, last_name, company_website, role } =
      req.body;
    const newUser = await knex("users").insert({
      mobile,
      password,
      first_name,
      last_name,
      company_website,
      role,
    });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedUser = await knex("users").where({ id }).update(updatedData);
    res.json(updatedUser);
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
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
