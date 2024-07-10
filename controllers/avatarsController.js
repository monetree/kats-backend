const { knex } = require("../db/connection");
const { textToSpeech } = require("../helpers/messageHelper");

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
    const result = {
      code: 200,
      data : data,
      message: "Data fetched successful",
      status: "success"
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRecommendations = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not specified
  const offset = (page - 1) * limit;

  try {
    const users = await knex("avatars")
      .select("id", "photo", "username", "only_face_video as video", "sound")
      .orderByRaw("RAND()")
      .limit(limit)
      .offset(offset);

    const totalUsers = await knex("avatars").count("id as count").first();
    const totalPages = Math.ceil(totalUsers.count / limit);

    const result = {
      code: 200,
      data: users,
      message: "Data fetched successfully",
      status: "success",
      pagination: {
        totalItems: totalUsers.count,
        totalPages: totalPages,
        currentPage: page,
        pageSize: limit
      }
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const getFeatured = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not specified
  const offset = (page - 1) * limit;

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
      .limit(limit)
      .offset(offset);

    // Format the categories as an array
    const formattedUsers = users.map((user) => ({
      ...user,
      categories: JSON.parse(user.categories),
    }));

    const totalUsers = await knex("avatars")
      .where("is_romantic", true)
      .count("id as count")
      .first();
    const totalPages = Math.ceil(totalUsers.count / limit);

    const result = {
      code: 200,
      data: formattedUsers,
      message: "Data fetched successfully",
      status: "success",
      pagination: {
        totalItems: totalUsers.count,
        totalPages: totalPages,
        currentPage: page,
        pageSize: limit
      }
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getExplore = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not specified
  const offset = (page - 1) * limit;

  try {
    const users = await knex("avatars")
      .select(
        "id",
        "photo",
        "username",
        "half_body_video as video",
        "sound",
        knex.raw("50000 as likes_count"),
        knex.raw("150000 as msg_count")
      )
      .limit(limit)
      .offset(offset);

    const totalUsers = await knex("avatars").count("id as count").first();
    const totalPages = Math.ceil(totalUsers.count / limit);

    const result = {
      code: 200,
      data: users,
      message: "Data fetched successfully",
      status: "success",
      pagination: {
        totalItems: totalUsers.count,
        totalPages: totalPages,
        currentPage: page,
        pageSize: limit
      }
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const getAvatar = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await knex("avatars")
      .select("id", "photo", "username", "half_body_video as video", "profession")
      .where({ username })
      .first();

    const result = {
      code: 200,
      data : user,
      message: "Data fetched successful",
      status: "success"
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


async function getAudio() {
  try {
    const { message, avatarId } = request.body;
    const voice = await textToSpeech(avatarId, message);
    return `https://kats-backend.yellowbay-b592c099.eastus.azurecontainerapps.io${voice}`
  } catch (error) {
    console.error("Error interacting with OpenAI:", error);
  }
}



module.exports = {
  getRecommendations,
  getExplore,
  getFeatured,
  getAvatar,
  onBoarding,
  getAudio
};
