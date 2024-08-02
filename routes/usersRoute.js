const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");

router.post("/login", usersController.loginUser);
router.post("/status/id", usersController.checkStatus);
router.patch("/update/:id", usersController.updateUser);
router.delete("/delete/:id", usersController.deleteUser);

router.post("/message", usersController.getMesages);
router.post("/recent-chats", usersController.getRecentChats);
router.get("/create-coin", usersController.createCoins);
router.get("/get-coin", usersController.fetchCoins);



module.exports = router;
