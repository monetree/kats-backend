const { knex } = require("../db/connection");

const getReviews = async (req, res) => {
  try {
    const reviews = await knex("reviews").select("*");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { rating, comment, order_id } = req.body;
    const newReview = await knex("reviews").insert({
      rating,
      comment,
      order_id,
    });
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedReview = await knex("reviews").where({ id }).update(updatedData);
    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await knex("reviews").where({ id }).del();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
};
