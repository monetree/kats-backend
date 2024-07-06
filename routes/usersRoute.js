const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");

router.post("/login", usersController.loginUser);
router.post("/status/id", usersController.checkStatus);
router.patch("/update/:id", usersController.updateUser);
router.delete("/delete/:id", usersController.deleteUser);

module.exports = router;
