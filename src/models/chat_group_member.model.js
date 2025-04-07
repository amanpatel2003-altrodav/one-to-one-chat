const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GroupUser = sequelize.define("GroupUser", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.STRING, // Storing user IDs as strings
    allowNull: false,
  },
  room_id: {
    type: DataTypes.UUID, // Storing room IDs as strings
    allowNull: false,
  },
},{
  timestamps:true
});
module.exports = GroupUser;
