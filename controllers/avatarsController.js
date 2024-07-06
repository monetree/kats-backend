const { knex } = require("../db/connection");

const onBoarding = async (req, res) => {
  try {
    const data = {
      chats: [
        {
          name: "Hina J",
          is_video: true,
          time: "18:16",
          img: "https://protraveller-avdphueketfphta9.z02.azurefd.net/kats/static/Hina.png",
        },
        {
          name: "Yumi K",
          is_video: true,
          time: "13:11",
          img: "https://protraveller-avdphueketfphta9.z02.azurefd.net/kats/static/Yumi.png",
        },
      ],
      title: "Connect with Your Favorite Influencers Like Never Before",
      description:
        "Chat, call, and video call with AI avatars of real influencers. Get genuine photos and videos on request.",
      images: [
        "https://protraveller-avdphueketfphta9.z02.azurefd.net/kats/static/Hyejin.png",
        "https://protraveller-avdphueketfphta9.z02.azurefd.net/kats/static/Anna.png",
        "https://protraveller-avdphueketfphta9.z02.azurefd.net/kats/static/Aoi.png",
      ],
    };
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const users = await knex("avatars")
      .select("id", "photo", "username", "only_face_video as video", "sound")
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
        "half_body_video as video",
        "sound"
      )
      .where("is_romantic", true)
      .limit(10);

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
      "sound",
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
  onBoarding,
};
