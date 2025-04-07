const fs = require("fs");
const path = require("path");
const GroupMessage = require("../models/chat_group_message.model.js");
const sequelize = require("../config/database.js");
const { v4: uuidv4 } = require("uuid");
const isSeeded = require("./seeded");

const seedGroupMessages = async () => {
  try {
    // Check if this seeder has already been executed
    if (isSeeded.isSeedGroupMessages) {
      console.log("✅ Seeder 'seedGroupMessages' has already been executed.");
      return;
    }

    // Perform the seeding
    await sequelize.sync();
    await GroupMessage.bulkCreate([
      {
        id: uuidv4(),
        room_id: uuidv4(),
        sender_id: "user-uuid-1",
        message_text: "Welcome to the group!",
        media_url: null,
        message_type: "text",
        deleted_at: null,
      },
      {
        id: uuidv4(),
        room_id: uuidv4(),
        sender_id: "user-uuid-2",
        message_text: "Hello everyone!",
        media_url: null,
        message_type: "text",
        deleted_at: null,
      },
    ]);

    console.log("✅ Group messages seeded successfully!");

    // Update the isSeeded object and write it back to the file
    isSeeded.isSeedGroupMessages = true;
    const seededFilePath = path.join(__dirname, "seeded.js");
    const updatedContent = `const isSeeded = ${JSON.stringify(isSeeded, null, 2)};\nmodule.exports = isSeeded;`;
    fs.writeFileSync(seededFilePath, updatedContent);
  } catch (error) {
    console.error("❌ Error seeding group messages:", error);
  }
};

module.exports = seedGroupMessages;