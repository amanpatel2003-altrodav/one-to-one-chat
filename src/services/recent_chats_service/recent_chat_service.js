const GroupMessage = require("../../models/chat_group_message.model.js");
const User = require("../../models/user");
const moment = require("moment");

// 🛠️ Function to process recent chat messages
const processRecentChats = async (chatMap, userId) => {
  return await Promise.all(
    Array.from(chatMap.values()).map(async (msg) => {
      // Always get the receiver's userId (not the sender's)
      const receiverId =
        msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

      // Fetch receiver's details (only the other person's info)
      const receiver = await User.findOne({
        where: { userId: receiverId },
        attributes: ["userId", "name", "profilePicUrls"],
      });
      return {
        id: msg.id,
        roomId: receiverId, // Chat with this user
        lastMessage: msg.message_text || msg.message_type, // Show text or type
        mediaUrl: msg.media_url,
        formattedTime: formatTime(msg.createdAt), // Format time dynamically
        receiver: receiver ? receiver : null, // If no receiver found, set null
      };
    })
  );
};
// 🕒 Helper function to format time
const formatTime = (timestamp) => {
  const now = moment();
  const messageTime = moment(timestamp);

  if (now.diff(messageTime, "minutes") < 1) return "Now";
  if (now.diff(messageTime, "minutes") < 60)
    return `${now.diff(messageTime, "minutes")} min ago`;
  if (now.diff(messageTime, "hours") < 12)
    return `${now.diff(messageTime, "hours")} hour ago`;
  return messageTime.format("h:mm A"); // Show time in "6:45 PM" format
};

module.exports = { processRecentChats, formatTime };
