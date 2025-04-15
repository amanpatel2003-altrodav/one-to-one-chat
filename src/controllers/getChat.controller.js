const { Op } = require("sequelize");
const Message = require("../models/chat.model.js");
const User = require("../models/user");
const {
  processRecentChats,
} = require("../services/recent_chats_service/recent_chat_service");
const RoomIDGenerate = require("../utils/RoomId/RoomID.generate");
const moment = require("moment");
const ChatConnection = require("../models/chat.connection.model.js");
class GetChats {
  async SearchUser(req, res) {
    try {
      const { SearchQuery } = req.query; // Get search term from request query
      if (!SearchQuery) {
        return res.status(400).json({ message: "Search query is required" });
      }
      // Search users by name or username (case-insensitive)
      const users = await ChatConnection.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${SearchQuery}%` } }, // Case-insensitive search
            { username: { [Op.iLike]: `%${SearchQuery}%` } },
          ],
        },
        attributes: ["userId", "name", "username", "profilePicUrls"], // Select only necessary fields
      });
      res.status(200).json({ success: true, users });
    } catch (error) {
      console.error("Error searching users:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
  async GetChatHistory(req, res) {
    try {
      const senderId = req.user.userId;
      console.log("sender id", senderId);
      const receiverId = req.query.receiverId;
      console.log("receiver id", receiverId);
      if (!senderId || !receiverId) {
        return res.status(400).json({ message: "Both user IDs are required" });
      }
      const isSenderConnected = await ChatConnection.findOne({
        where: { userId: senderId },
      });
      if (!isSenderConnected) {
        return res.status(404).json({ message: "users are not connected to each other" });
      }
      const isReceiverConnected = await ChatConnection.findOne({
        where: { userId: receiverId },
      });
      if (!isReceiverConnected) {
        return res.status(404).json({ message: "users are not connected to each other" });
      }
      // Get today's start time (midnight)
      const todayStart = moment().startOf("day").toDate();
      // Fetch chat history between both users for today only
      const messages = await Message.findAll({
        where: {
          room_id: {
            [Op.or]: [`${senderId}-${receiverId}`, `${receiverId}-${senderId}`],
          },
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
  // async getMessages(req, res) {
  //   try {
  //     const senderId = req.user.userId;
  //     const { receiverId } = req.query;
  //     if (!senderId || !receiverId) {
  //       return res
  //         .status(400)
  //         .json({ error: "Missing senderId or receiverId" });
  //     }
  //     const roomId = RoomIDGenerate.generateRoomId(senderId,receiverId);
  //     const messages = await Message.findAll({
  //       where: { room_id: roomId },
  //       order: [["createdAt", "ASC"]],
  //       limit: 20,
  //     });

  //     res.status(200).json({ success: true, messages });
  //   } catch (err) {
  //     console.error("❌ Error Fetching Messages:", err);
  //     res.status(500).json({ error: "Internal Server Error" });
  //   }
  // }
  async getMessages(req, res) {
    try {
      const senderId = req.user.userId;
      console.log("senderId", senderId);
      console.log("req.query", req.query);
      const { receiverId, page = 1 } = req.query;
      const limit = 20; // Fetch 20 messages per request
      const offset = (page - 1) * limit;

      if (!senderId || !receiverId) {
        return res
          .status(400)
          .json({ error: "Missing senderId or receiverId" });
      }
      const isSenderConnected = await ChatConnection.findOne({
        where: { userId: senderId },
      });
      if (!isSenderConnected) {
        return res.status(404).json({ message: "users are not connected to each other" });
      }
      const isReceiverConnected = await ChatConnection.findOne({
        where: { userId: receiverId },
      });
      if (!isReceiverConnected) {
        return res.status(404).json({ message: "users are not connected to each other" });
      }
      const roomId = await RoomIDGenerate.generateRoomId(senderId, receiverId);

      // Fetch messages with pagination
      const messages = await Message.findAll({
        where: { room_id: roomId },
        order: [["createdAt", "ASC"]],
        limit,
        offset,
      });
      console.log("messages", messages);
      // Check if there are more messages to load
      const totalMessages = await Message.count({ where: { room_id: roomId } });
      const hasMore = offset + limit < totalMessages;

      res.status(200).json({ success: true, messages, hasMore });
    } catch (err) {
      console.error("❌ Error Fetching Messages:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async recentChatList(req, res) {
    try {
      const userId = req.user.userId; // Get senderId from authenticated user

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const isSenderConnected = await ChatConnection.findOne({
        where: { userId: userId },
      });
      if (!isSenderConnected) {
        return res.status(404).json({ message: "users are not connected to each other" });
      }
      // Fetch all messages sorted by latest timestamp
      const message = await Message.findOne({
        where: {
          [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
        },
        order: [["createdAt", "DESC"]], // Latest messages first
      });

      // Group messages by roomId (senderId-receiverId or vice versa)
      const chatMap = new Map();

      const roomId =
        message.sender_id < message.receiver_id
          ? `${message.sender_id}-${message.receiver_id}`
          : `${message.receiver_id}-${message.sender_id}`;

      if (!chatMap.has(roomId)) {
        chatMap.set(roomId, message); // Store only the latest message for each chat
      }

      // Convert to array and fetch receiver details
      const recentChats = await processRecentChats(chatMap, userId);

      res.status(200).json({ success: true, chats: recentChats });
    } catch (error) {
      console.error("Error fetching recent chats:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}
module.exports = new GetChats();
