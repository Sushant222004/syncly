const express = require("express");
const { register, login } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { getMe , updateAvatar } = require("../controllers/userController");
const {
  createDirectConversation,getConversations, createGroupConversation, getUsers
} = require("../controllers/conversationController");
const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getMe);
router.patch("/me/avatar", auth, upload.single("avatar"), updateAvatar);
router.post("/conversations/direct", auth, createDirectConversation);
router.post("/conversations/group", auth, createGroupConversation);
router.post("/messages", auth, sendMessage);
router.get("/messages/:conversationId", auth, getMessages);
router.get("/conversations", auth, getConversations);
router.get("/users", auth, getUsers);
module.exports = router;
