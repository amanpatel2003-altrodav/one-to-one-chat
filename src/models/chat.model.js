const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Adjust the path based on your setup

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    room_id: { 
      type: DataTypes.STRING,  // ✅ Changed from UUID to STRING
      allowNull: false 
    },
    sender_id: { 
      type: DataTypes.STRING, // ✅ Changed from UUID to STRING
      allowNull: false 
    },
    receiver_id: { 
      type: DataTypes.STRING, // ✅ Changed from UUID to STRING
      allowNull: false 
    },
    message_text: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    media_url: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    message_type: {
      type: DataTypes.ENUM("text", "image", "video", "audio"),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Message;
