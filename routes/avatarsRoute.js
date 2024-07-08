const express = require("express");
const router = express.Router();
const avatarsController = require("../controllers/avatarsController");

router.get("/recommendations", avatarsController.getRecommendations);
router.get("/explore", avatarsController.getExplore);
router.get("/featured", avatarsController.getFeatured);
router.get("/details/:username", avatarsController.getAvatar);
router.get("/onboarding", avatarsController.onBoarding);

module.exports = router;
