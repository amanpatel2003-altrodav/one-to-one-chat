const fs = require("fs");
const path = require("path");
const GroupUser = require("../models/chat_group_member.model");
const sequelize = require("../config/database.js");
const { v4: uuidv4 } = require("uuid");
const isSeeded = require("./seeded");

const seedGroupUsers = async () => {
  try {
    // Check if this seeder has already been executed
    if (isSeeded.seedGroupUsers) {
      console.log("✅ Seeder 'seedGroupUsers' has already been executed.");
      return;
    }

    // Perform the seeding
    await sequelize.sync();
    await GroupUser.bulkCreate([
      {
        id: uuidv4(),
        user_id: "user-uuid-1",
        room_id: uuidv4(),
      },
      {
        id: uuidv4(),
        user_id: "user-uuid-2",
        room_id: uuidv4(),
      },
    ]);

    console.log("✅ Group users seeded successfully!");

    // Update the isSeeded object and write it back to the file
    isSeeded.seedGroupUsers = true;
    const seededFilePath = path.join(__dirname, "seeded.js");
    const updatedContent = `const isSeeded = ${JSON.stringify(isSeeded, null, 2)};\nmodule.exports = isSeeded;`;
    fs.writeFileSync(seededFilePath, updatedContent);
  } catch (error) {
    console.error("❌ Error seeding group users:", error);
  }
};

module.exports = seedGroupUsers;