const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const UserIdGenerator = require('../utils/userIdGenerator');

class User extends Model {}

User.init({
  userId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    unique: true,
    allowNull: false,
    defaultValue: () => UserIdGenerator.generate()
  },
  
  mobileNumber: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    validate: {
      is: /^\d{10,14}$/ // Validate digits only, without country code
    }
  },
  
  countryCode: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '+91' // Default to India, but can be changed
  },

  platformType: {
    type: DataTypes.ENUM('iOS', 'Android'),
    allowNull: true
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true
  },

  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },

  profilePicUrl: {
    type: DataTypes.STRING, // Stores the S3 URL
    allowNull: true,
  },

  verificationPhotoProcessed: {
    type: DataTypes.BOOLEAN, // True if processed
    defaultValue: false,
  },

  gender: {
    type: DataTypes.ENUM("Male", "Female"),
    allowNull: true,
  },

  dob: {
    type: DataTypes.STRING, // Format: DD/MM/YYYY
    allowNull: true,
  },
  
  qrCode: {
    type: DataTypes.TEXT(255),
    allowNull: true
  },

  deepLink: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },

  otp: {
    type: DataTypes.STRING(6),
    allowNull: true
  },

  otpExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  isProfileCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['mobileNumber', 'countryCode']
    }
  ]
});

module.exports = User;