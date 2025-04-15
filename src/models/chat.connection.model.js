const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Adjust the path to your Sequelize instance

// Define the schema for user connections
const ChatConnection = sequelize.define(
  "ChatConnection",
  {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      trim: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      trim: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      trim: true,
    },
    profilePicUrls: {
      type: DataTypes.TEXT,
      get() {
        return this.getDataValue("profilePicUrls")
          ? JSON.parse(this.getDataValue("profilePicUrls"))
          : [];
      },
      set(value) {
        this.setDataValue("profilePicUrls", JSON.stringify(value));
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = ChatConnection;
