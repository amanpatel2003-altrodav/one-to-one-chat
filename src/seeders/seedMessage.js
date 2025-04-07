const fs = require("fs");
const path = require("path");
const Message = require("../models/chat.model");
const sequelize = require("../config/database.js");
const isSeeded = require("./seeded");
const { v4: uuidv4 } = require("uuid");
const seedMessages = async () => {
  try {
    if (isSeeded.seedMessages) {
      console.log("✅ Seeder 'seedMessages' has already been executed.");
      return;
    }

    await sequelize.sync();
    await Message.bulkCreate([
      {
        id: uuidv4(),
        room_id: "room-uuid-1",
        sender_id: "user-uuid-1",
        receiver_id: "user-uuid-2",
        message_text: "Hello!",
        media_url: null,
        message_type: "text",
        deleted_at: null,
      },
      {
        id: uuidv4(),
        room_id: "room-uuid-1",
        sender_id: "user-uuid-2",
        receiver_id: "user-uuid-1",
        message_text: "Hi there!",
        media_url: null,
        message_type: "text",
        deleted_at: null,
      },
    ]);

    console.log("✅ Messages seeded successfully!");

    isSeeded.seedMessages = true;
    const seededFilePath = path.join(__dirname, "seeded.js");
    const updatedContent = `const isSeeded = ${JSON.stringify(isSeeded, null, 2)};\nmodule.exports = isSeeded;`;
    fs.writeFileSync(seededFilePath, updatedContent);
  } catch (error) {
    console.error("❌ Error seeding messages:", error);
  }
};

module.exports = seedMessages;