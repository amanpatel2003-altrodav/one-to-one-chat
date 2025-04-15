const fs = require("fs");
const path = require("path");
const ChatConnection = require("../models/chat.connection.model.js");
const sequelize = require("../config/database.js");
const { v4: uuidv4 } = require("uuid");
const isSeeded = require("./seeded");

const seedChatConnections = async () => {
  try {
    // Check if this seeder has already been executed
    if (isSeeded.isSeedChatConnections) {
      console.log("✅ Seeder 'seedChatConnections' has already been executed.");
      return;
    }

    // Perform the seeding
    await sequelize.sync();
    await ChatConnection.bulkCreate([
      {
        userId: uuidv4(),
        username: "john_doe",
        name: "John Doe",
        profilePicUrls: ["https://example.com/john_doe_pic1.jpg"],
      },
      {
        userId: uuidv4(),
        username: "jane_smith",
        name: "Jane Smith",
        profilePicUrls: ["https://example.com/jane_smith_pic1.jpg"],
      },
    ]);

    console.log("✅ Chat connections seeded successfully!");

    // Update the isSeeded object and write it back to the file
    isSeeded.isSeedChatConnections = true;
    const seededFilePath = path.join(__dirname, "seeded.js");
    const updatedContent = `const isSeeded = ${JSON.stringify(
      isSeeded,
      null,
      2
    )};\nmodule.exports = isSeeded;`;
    fs.writeFileSync(seededFilePath, updatedContent);
  } catch (error) {
    console.error("❌ Error seeding chat connections:", error);
  }
};

module.exports = seedChatConnections;
