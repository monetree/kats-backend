const { knex } = require("../db/connection");

const getOrders = async (req, res) => {
  try {
    const orders = await knex("orders").select("*");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { is_completed, info, user_id } = req.body;
    const newOrder = await knex("orders").insert({
      is_completed,
      info,
      user_id,
    });
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedOrder = await knex("orders").where({ id }).update(updatedData);
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await knex("orders").where({ id }).del();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
};
