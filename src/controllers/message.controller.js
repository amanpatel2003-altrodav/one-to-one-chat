const { Op } = require("sequelize");
const Message = require("../models/chat.model");
const pusher = require("../services/pusher_service/pusher.service");
const RoomIDGenerate = require("../utils/RoomId/RoomID.generate");
const User = require("../models/user");
const { uploadToS3 } = require("../services/s3.service");
const ChatConnection = require("../models/chat.connection.model");
class MessageController {
  async sendMessage(req, res) {
    try {
      const senderId = req.user.userId;
      const receiverId = req.query.receiverId;
      const { message } = req.body;
      const file = req.files?.media_url;
      console.log(senderId, receiverId, message);
      if (!senderId || !receiverId || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const senderIdEntry = await User.findByPk(senderId);
      if (!senderIdEntry) {
        return res.status(404).json({ error: "Sender not found" });
      }
      const IsSenderConnected = await ChatConnection.findOne({
        where: { userId: senderId },
      });
      if (!IsSenderConnected) {
        return res.status(404).json({ error: "users are not connected to each other" });
      }
      const receiverIdEntry = await User.findByPk(receiverId);
      console.log("receiverIdEntry", receiverIdEntry);
      if (!receiverIdEntry) {
        return res.status(404).json({ error: "Receiver not found" });
      }
      const IsReceiverConnected = await ChatConnection.findOne({
        where: { userId: receiverId },
      });
      if (!IsReceiverConnected) {
        return res.status(404).json({ error: "users are not connected to each other" });
      }
      const roomId = await RoomIDGenerate.generateRoomId(senderId, receiverId);
      let mediaUrl = null;
      let messageType = "text";

      if (file) {
        const { url, type } = await uploadToS3(file, "chat-media");
        mediaUrl = url;
        messageType = type; // "image", "video", or "audio"
      }
      const messageData = {
        room_id: roomId,
        sender_id: senderId,
        receiver_id: receiverId,
        message_text: message || null,
        media_url: mediaUrl, // Store the URL instead of the full path
        message_type: messageType,
        createdAt: new Date(),
      };
      // await producer.send({
      //   topic: "chat-messages",
      //   messages: [{ value: JSON.stringify(messageData) }],
      // });
      pusher.trigger(
        `chat-room-${messageData.room_id}`,
        "new-message",
        messageData
      );
      // ✅ Save Message to PostgreSQL
      const dbSavedData = await Message.create(messageData);
      return res
        .status(200)
        .json({ success: true, message: "Message sent", dbSavedData });
    } catch (err) {
      console.error("❌ Error Processing sendMessage:", err);
      return res.status(500).json({ error: err.message });
    }
  }
  async editMessage(req, res) {
    try {
      const senderId = req.user.userId;
      const { messageId } = req.params;
      const { newMessage } = req.body;
      const senderIdEntry = await User.findByPk(senderId);
      if (!senderIdEntry) {
        return res.status(404).json({ error: "Sender not found" });
      }
      const IsSenderConnected = await ChatConnection.findOne({
        where: { userId: senderId },
      });
      if (!IsSenderConnected) {
        return res.status(404).json({ error: "users are not connected to each other" });
      }
      if (!messageId || !newMessage) {
        return res
          .status(400)
          .json({ error: "Missing messageId or newMessage" });
      }

      // ✅ Find the message
      const message = await Message.findOne({
        where: { id: messageId, sender_id: senderId },
      });
      if (!message) {
        return res
          .status(404)
          .json({ error: "Message not found or not owned by user" });
      }

      // ✅ Update message
      message.message_text = newMessage;
      await message.save();

      pusher.trigger(
        `chat-room-${message?.room_id}`,
        "messageUpdated",
        message
      );

      res.status(200).json({
        success: true,
        message: "Message updated successfully",
        updatedMessage: message,
      });
    } catch (err) {
      console.error("❌ Error Editing Message:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async deleteMessage(req, res, next) {
    try {
      const userId = req.user.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const senderIdEntry = await User.findByPk(userId);
      if (!senderIdEntry) {
        return res.status(404).json({ error: "user not found" });
      }
      const IsSenderConnected = await ChatConnection.findOne({
        where: { userId: userId },
      });
      if (!IsSenderConnected) {
        return res.status(404).json({ error: "users are not connected to each other" });
      }
      const { messageId } = req.params;
      if (!messageId) {
        return res.status(400).json({ error: "Missing messageId" });
      }

      // ✅ Find message
      const message = await Message.findOne({
        where: { id: messageId, sender_id: userId },
      });

      if (!message) {
        return res
          .status(404)
          .json({ error: "Message not found or not owned by user" });
      }

      // ✅ Mark message for deletion after 7 days
      const deletionTimestamp = new Date();
      deletionTimestamp.setDate(deletionTimestamp.getDate() + 7); // Add 7 days
      message.deleted_at = deletionTimestamp;
      await message.save();

      // ✅ Emit event via Pusher to notify users about deletion
      pusher.trigger(`chat-room-${message?.room_id}`, "messageDeleted", {
        messageId,
        delayed: true, // Indicating it's a soft delete
      });

      res
        .status(200)
        .json({ success: true, message: "Message will be deleted in 7 days" });
      next();
    } catch (err) {
      console.error("❌ Error Deleting Message:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async deleteExpiredMessages() {
    try {
      const now = new Date();
      const messagesToDelete = await Message.findAll({
        where: { deleted_at: { [Op.lte]: now } }, // Messages where `deleted_at` <= current time
      });

      if (messagesToDelete.length === 0) {
        console.log("✅ No expired messages found");
        return;
      }

      for (const message of messagesToDelete) {
        await message.destroy();
        console.log(`🗑️ Deleted message: ${message.id}`);

        // ✅ Notify clients about permanent deletion
        const roomId = [message.sender_id, message.receiver_id]
          .sort()
          .join("-");
        pusher.trigger(`chat-room-${roomId}`, "messageDeleted", {
          messageId: message.id,
          delayed: false, // Indicating it's a permanent delete
        });
      }
    } catch (err) {
      console.error("❌ Error deleting expired messages:", err);
    }
  }
}
module.exports = MessageController;
