const express = require("express");
const router = express.Router();
const { knex } = require("../db/connection");

const getConversations = async (req, res) => {
  const { userId, avatarId, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const conversations = await knex("conversations")
      .where({
        user_id: userId,
        avatar_id: avatarId,
      })
      .limit(limit)
      .offset(offset);

    res.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Error fetching conversations" });
  }
};

module.exports = {
  getConversations,
};
