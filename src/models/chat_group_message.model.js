const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GroupMessage = sequelize.define(
  "GroupMessage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    room_id: {
      type: DataTypes.UUID, // Storing room IDs as strings
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.STRING, // Storing sender ID as a string
      allowNull: false,
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    media_url: {
      type: DataTypes.STRING,
      allowNull: true,
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

module.exports = GroupMessage;
