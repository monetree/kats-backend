const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");

router.get("/login", usersController.loginUser);
router.patch("/update/:id", usersController.updateUser);
router.delete("/delete/:id", usersController.deleteUser);

module.exports = router;
