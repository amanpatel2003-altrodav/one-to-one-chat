const MessageController = require("../controllers/message.controller")
const express = require("express");
const { SearchUser, GetChatHistory, getMessages, recentChatList } = require("../controllers/getChat.controller")
const fileUpload = require("express-fileupload");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
const messageController = new MessageController();
router.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded (5MB maximum)',
  useTempFiles: false,
  createParentPath: true,
  parseNested: true,
  arrayLimit: 3 // Limit to 3 profile photos
}));
router.post(
  "/send-message",
  authMiddleware.authenticate,
  messageController.sendMessage
);
router.put(
  "/editMessage/:messageId",
  authMiddleware.authenticate,
  messageController.editMessage
)
router.delete(
  "/deleteMessage/:messageId",
  authMiddleware.authenticate,
  messageController.deleteMessage,
  messageController.deleteExpiredMessages
);
router.get(
  "/getMessages",
  authMiddleware.authenticate,
  getMessages
);
router.get(
  "/searchuser",
  SearchUser
)
router.get(
  "/getChatHistory",
  authMiddleware.authenticate,
  GetChatHistory
)
router.get(
  "/recentChats",
  authMiddleware.authenticate,
  recentChatList
)
module.exports = router;
