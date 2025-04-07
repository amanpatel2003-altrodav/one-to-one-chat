const { Op } = require("sequelize");
const moment = require("moment");
const User = require("../models/user.js");
const {
  formatTime,
} = require("../services/recent_chats_service/recent_chat_service");
const Group = require("../models/chat_group.model.js");
const GroupMessage = require("../models/chat_group_message.model.js");
class GetGroupChats {
  async SearchGroup(req, res) {
    try {
      const { SearchQuery } = req.query; // Get search term from request query

      if (!SearchQuery) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Search users by name or username (case-insensitive)
      const group = await Group.findAll({
        where: {
          name: { [Op.iLike]: `%${SearchQuery}%` },
        },
        attributes: ["id", "name", "created_by"], // Select only necessary fields
      });

      res.status(200).json({ success: true, group });
    } catch (error) {
      console.error("Error searching users:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
  async GetChatHistory(req, res) {
    try {
      const room_id = req.query.roomId;

      // Get today's start time (midnight)
      const todayStart = moment().startOf("day").toDate();

      // Fetch chat history between both users for today only
      const messages = await GroupMessage.findAll({
        where: {
          room_id: room_id,
          createdAt: {
            [Op.gte]: todayStart, // Only fetch messages created today
          },
        },
        order: [["createdAt", "ASC"]], // Sort by oldest messages first
      });
      res.status(200).json({ success: true, messages });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
  async getMessages(req, res) {
    try {
      const { roomId, page = 1 } = req.query;
      const limit = 20; // Fetch 20 messages per request
      const offset = (page - 1) * limit;

      if (!roomId) {
        return res.status(400).json({ error: "Missing roomId" });
      }

      // Fetch messages with pagination
      const messages = await GroupMessage.findAll({
        where: { room_id: roomId },
        order: [["createdAt", "ASC"]],
        limit,
        offset,
      });
      console.log("messages", messages);
      // Check if there are more messages to load
      const totalMessages = await GroupMessage.count({
        where: { room_id: roomId },
      });
      const hasMore = offset + limit < totalMessages;

      res.status(200).json({ success: true, messages, hasMore });
    } catch (err) {
      console.error("❌ Error Fetching Messages:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async recentGroupChats(req, res) {
    try {
      const roomId = req.query.roomId;

      if (!roomId) {
        return res.status(400).json({ message: "room ID is required" });
      }

      // Fetch the latest message for the given room
      const latestMessage = await GroupMessage.findOne({
        where: { room_id: roomId },
        order: [["createdAt", "DESC"]], // Get the most recent message
      });

      if (!latestMessage) {
        return res.status(200).json({ success: true, chats: [] });
      }

      // Fetch sender details
      const senderInfo = await User.findByPk(latestMessage.sender_id, {
        attributes: ["userId", "name", "profilePicUrls"],
      });

      const recentChat = {
        id: latestMessage.id,
        roomId: latestMessage.room_id,
        lastMessage: latestMessage.message_text || latestMessage.message_type, // Show text or media type
        mediaUrl: latestMessage.media_url,
        formattedTime: formatTime(latestMessage.createdAt), // Format time dynamically
        senderInfo: senderInfo || null,
      };

      res.status(200).json({ success: true, chat: recentChat });
    } catch (error) {
      console.error("Error fetching recent group chat:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}
module.exports = new GetGroupChats();