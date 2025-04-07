const express = require("express")
const GroupChatController = require("../controllers/groupChat.controller")
const {
  SearchGroup,
  GetChatHistory,
  getMessages,
  recentGroupChats,
} = require("../controllers/getGroupChats.controller")
const fileUpload = require("express-fileupload");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
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
  "/create-group",
  authMiddleware.authenticate,
  GroupChatController.CreateGroup
);
router.post(
  "/join-group/:groupid",
  authMiddleware.authenticate,
  GroupChatController.JoinGroup
);
router.post(
  "/send-group-message",
  authMiddleware.authenticate,
  GroupChatController.SendMessageInGroup
);
router.put("/editMessage/:messageId",authMiddleware.authenticate,GroupChatController.editMessage);
router.delete("/deleteMessage/:messageId",authMiddleware.authenticate,GroupChatController.deleteMessage)
router.get("/GetMessages", authMiddleware.authenticate, getMessages);
router.get("/SearchGroup", authMiddleware.authenticate, SearchGroup);
router.get("/GroupChatHistory", authMiddleware.authenticate, GetChatHistory);
router.get("/GetRecentChats", authMiddleware.authenticate, recentGroupChats);
module.exports = router;
