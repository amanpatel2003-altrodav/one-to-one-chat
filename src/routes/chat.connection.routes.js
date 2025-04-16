const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { sendChatConnection, acceptRequest } = require("../controllers/connnection.controller");
const router = express.Router();
router.post("/connect",authenticate,sendChatConnection)
router.post("/accept-request",authenticate,acceptRequest)
module.exports = router
