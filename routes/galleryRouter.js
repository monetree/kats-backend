const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/galleryController");

router.get("/", galleryController.getGallery);
router.post("/", galleryController.createGallery);
router.put("/:id", galleryController.updateGallery);
router.delete("/:id", galleryController.deleteGallery);

module.exports = router;
