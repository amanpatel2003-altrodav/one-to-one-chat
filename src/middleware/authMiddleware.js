const jwt = require('jsonwebtoken');
const User = require('../models/user');
const dotenv = require("dotenv");
dotenv.config();
class AuthMiddleware {
  /**
   * Authenticate JWT Token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async authenticate(req, res, next) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      console.log("token",token)

      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Now:", Date.now());
        console.log("Token expiry:", decoded.exp * 1000);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          console.warn('⚠️ Token expired. Attempting to refresh...');
          return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
        }
        throw error;
      }

      const user = await User.findByPk(decoded.userId);
      console.log("user in auth middleware",user);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      console.error('Authentication Error:', error);
      res.status(500).json({ success: false, message: 'Authentication failed' });
    }
  }
}

module.exports = new AuthMiddleware();
