const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const messageController = require("../controllers/messageController");

router.post("/login", usersController.loginUser);
router.post("/status/id", usersController.checkStatus);
router.patch("/update/:id", usersController.updateUser);
router.delete("/delete/:id", usersController.deleteUser);

router.post("/message", usersController.getMesages);
router.post("/recent-chats", usersController.getRecentChats);
router.get("/create-coin", usersController.createCoins);
router.get("/get-coin", usersController.fetchCoins);
router.get("/generate-img", usersController.generateImg);
router.get("/voice", messageController.sendMessageToOpenAI);





module.exports = router;
