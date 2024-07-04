const express = require("express");
const router = express.Router();
const costsController = require("../controllers/costsController");

router.get("/", costsController.getCosts);
router.post("/", costsController.createCost);
router.put("/:id", costsController.updateCost);
router.delete("/:id", costsController.deleteCost);

module.exports = router;
