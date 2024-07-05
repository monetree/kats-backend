const { knex } = require("../db/connection");

const getRecommendations = async (req, res) => {
  try {
    const users = await knex("avatars")
      .select("id", "photo", "username", "only_face_video as video")
      .orderByRaw("RAND()")
      .limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFeatured = async (req, res) => {
  try {
    const users = await knex("avatars")
      .select(
        "id",
        "photo",
        "country",
        "categories",
        "username",
        "half_body_video as video"
      )
      .where("is_romantic", true)
      .limit(10);

    console.log(users);

    // Format the categories as an array
    const formattedUsers = users.map((user) => ({
      ...user,
      categories: JSON.parse(user.categories),
    }));

    res.json(formattedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getExplore = async (req, res) => {
  try {
    const users = await knex("avatars").select(
      "id",
      "photo",
      "username",
      "half_body_video as video",
      knex.raw("50000 as likes_count"),
      knex.raw("150000 as msg_count")
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getRecommendations,
  getExplore,
  getFeatured,
};
