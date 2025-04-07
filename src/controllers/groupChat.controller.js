const Group = require("../models/chat_group.model.js");
const GroupUser = require("../models/chat_group_member.model.js");
const GroupMessage = require("../models/chat_group_message.model.js");
const pusher = require("../services/pusher_service/pusher.service.js");
const User = require("../models/user");
const { uploadToS3 } = require("../services/s3.service.js");
class GroupChatController {
  async CreateGroup(req, res) {
    try {
      const { groupname, groupcreator } = req.body;
      if (!groupname || !groupcreator) {
        res.status(400).json({
          message: "plz complete the fillings",
        });
      }
      const group = await Group.create({
        name: groupname,
        created_by: groupcreator,
      });
      return res.status(200).json({
        message: "Group created",
        group,
      });
    } catch (err) {
      return res.status(500).json({
        message: "error during group creation",
        error: err.message,
      });
    }
  }
  async JoinGroup(req, res) {
    try {
      const { groupid } = req.params;
      const { groupjoinerid } = req.query;
      if (!groupid) {
        res.status(400).json({
          message: "group id is missing",
        });
      }
      if (!groupjoinerid) {
        res.status(400).json({
          message: "group joiner is missing",
        });
      }
      const group = await Group.findByPk(groupid);
      if (!group) {
        return res.status(400).json({
          message: "group not found",
        });
      }
      const isUserExists = await User.findByPk(groupjoinerid);
      if (!isUserExists) {
        return res.status(400).json({
          message: "user not found",
        });
      }
      const newMember = await GroupUser.create({
        user_id: groupjoinerid,
        room_id: groupid,
      });
      return res.status(200).json({
        message: "new member joined",
        newMember,
      });
    } catch (error) {
      return res.status(500).json({
        message: "error during group joining",
        error: error.message,
      });
    }
  }
  async SendMessageInGroup(req, res) {
    try {
      const senderId = req.user.userId;
      const roomId = req.query.roomId;
      const { message } = req.body;
      const file = req.files?.media_url;
      if (!senderId) {
        return res.status(400).json({ message: "Sender not present" });
      }
      const senderIdEntry = await User.findByPk(senderId);
      if (!senderIdEntry) {
        return res.status(404).json({ error: "Sender not found" });
      }
      if (!roomId) {
        return res.status(400).json({ message: "Invalid group" });
      }
      const group = await Group.findByPk(roomId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      if (!message) {
        return res
          .status(400)
          .json({ message: "Please enter a message before sending" });
      }
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
        message_text: message || null,
        media_url: mediaUrl,
        message_type: messageType,
        createdAt: new Date(),
      };
      // await producer.send({
      //   topic: "group-chat-messages",
      //   messages: [{ value: JSON.stringify(messageData) }],
      // });
      pusher.trigger(
        `chat-room-${messageData.room_id}`,
        "group-new-message",
        messageData
      );
      // ✅ Save Message to PostgreSQL
      const dbSavedData = await GroupMessage.create(messageData);
      return res.status(200).json({
        success: true,
        message: "Message sent successfully",
        dbSavedData
      });
    } catch (err) {
      console.error("❌ Error Processing SendMessageInGroup:", err);
      return res.status(500).json({ error: err.message });
    }
  }
  async editMessage(req, res) {
    try {
      const senderId = req.user.userId;
      const { messageId } = req.params;
      console.log("messageId", messageId);
      const { newMessage } = req.body;
      console.log("new message", newMessage);
      if (!senderId) {
        return res.status(400).json({ message: "Sender not present" });
      }
      const senderIdEntry = await User.findByPk(senderId);
      if (!senderIdEntry) {
        return res.status(404).json({ error: "Sender not found" });
      }
      if (!messageId || !newMessage) {
        return res
          .status(400)
          .json({ error: "Missing messageId or newMessage" });
      }

      // ✅ Find the message
      const message = await GroupMessage.findOne({
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
  async deleteMessage(req, res) {
    try {
      const userId = req.user.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const senderIdEntry = await User.findByPk(userId);
      if (!senderIdEntry) {
        return res.status(404).json({ error: "Sender not found" });
      }
      const { messageId } = req.params;

      if (!messageId) {
        return res.status(400).json({ error: "Missing messageId" });
      }

      // ✅ Find message
      const message = await GroupMessage.findOne({
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
      const roomId = messagesToDelete.room_id;
      for (const message of messagesToDelete) {
        await message.destroy();
        // ✅ Notify clients about permanent deletion
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
module.exports = new GroupChatController();
