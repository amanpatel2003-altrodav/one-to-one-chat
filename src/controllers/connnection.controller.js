const ChatConnection = require("../models/chat.connection.model");
const User = require("../models/user");

class ChatConnectionClass {
  async sendChatConnection(req, res) {
    try {
      const connectUserID = req.query.connectUserID;
      if (!connectUserID) {
        return res.status(400).json({ error: "Missing connectUserID" });
      }
      const connectUserEntry = await User.findByPk(connectUserID);
      if (!connectUserEntry) {
        return res.status(404).json({ error: "Connect user not found" });
      }
      const ourData = await User.findByPk(req.user.userId);
      if (!ourData) {
        return res.status(404).json({ error: "Our user not found" });
      }
      const ourDataEntryObj = {
        userId: req?.user?.userId,
        username: ourData?.username,
        name: ourData?.name,
        profilePicUrls: ourData?.profilePicUrls,
      };
      const connecTedUser = await ChatConnection.create(ourDataEntryObj);
      return res.status(200).json({
        success: true,
        message: "Connection sent successfully",
        connecTedUser,
      });
    } catch (error) {
      console.error("❌ Error Processing sendChatConnection:", error);
      return res.status(500).json({
        error: "Internal Server Error",
      });
    }
  }
  async acceptRequest(req, res) {
    try {
      const status = req.query.status;
      if (!status) {
        return res.status(400).json({ error: "Missing status" });
      }
      if (status !== "accept") {
        return res.status(200).json({ message: "Request not accepted" });
      }
      const connecTedUserId = req.query.connectUserID;
      if (!connecTedUserId) {
        return res.status(400).json({ error: "Missing connecTedUserId" });
      }
      const connecTedUserEntry = await User.findByPk(connecTedUserId);
      if (!connecTedUserEntry) {
        return res.status(404).json({ error: "Connect user not found" });
      }
      const ourEntry = await ChatConnection.findOne({
        where: { userId: req.user.userId },
      });
      if(!ourEntry) {
        return res.status(404).json({ error: "user cannot be accepted" });
      }
      const connecTedUserEntryObj = {
        userId: connecTedUserId,
        username: connecTedUserEntry?.username,
        name: connecTedUserEntry?.name,
        profilePicUrls: connecTedUserEntry?.profilePicUrls,
      };
      const acceptedRequest = await ChatConnection.create(connecTedUserEntryObj);
      return res.status(200).json({
        success: true,
        message: "Connection accepted successfully",
        acceptedRequest,
      });
    } catch (error) {
      console.error("❌ Error Processing acceptRequest:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
module.exports = new ChatConnectionClass();
