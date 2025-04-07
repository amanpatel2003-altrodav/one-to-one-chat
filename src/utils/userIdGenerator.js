const crypto = require('crypto');

class UserIdGenerator {
  /**
   * Generate a unique, secure user ID
   * @returns {string} Unique user ID
   */
  static generate() {
    const timestamp = Date.now().toString(36).slice(-5); // Use last 5 chars of timestamp
    const randomPart = crypto.randomBytes(3).toString('hex'); // 6-char random string
    return `ZM${timestamp}${randomPart}`.toUpperCase(); // Example: ZM5G7D3A2F
  }

  /**
   * Create a simple checksum for additional uniqueness
   * @param {string} input 
   * @returns {string} Checksum
   */
  static createChecksum(input) {
    return crypto
      .createHash('md5')
      .update(input)
      .digest('hex')
      .slice(0, 3)
      .toUpperCase();
  }

  /**
   * Validate generated user ID format
   * @param {string} userId 
   * @returns {boolean} Is valid user ID
   */
  static validate(userId) {
    // Validate format: starts with MX, has specific length, etc.
    const userIdRegex = /^MX[a-zA-Z0-9]{10,15}$/;
    return userIdRegex.test(userId);
  }
}

module.exports = UserIdGenerator;