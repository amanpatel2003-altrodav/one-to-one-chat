const fs = require("fs");
const path = require("path");
const Group = require("../models/chat_group.model");
const sequelize = require("../config/database.js");
const { v4: uuidv4 } = require("uuid");
const isSeeded = require("./seeded");

const seedGroups = async () => {
  try {
    // Check if this seeder has already been executed
    if (isSeeded.SeedGroups) {
      console.log("✅ Seeder 'seedGroups' has already been executed.");
      return;
    }

    // Perform the seeding
    await sequelize.sync();
    await Group.bulkCreate([
      {
        id: uuidv4(),
        name: "General",
        created_by: "user-uuid-1",
      },
      {
        id: uuidv4(),
        name: "Developers",
        created_by: "user-uuid-2",
      },
    ]);

    console.log("✅ Groups seeded successfully!");

    // Update the isSeeded object and write it back to the file
    isSeeded.SeedGroups = true;
    const seededFilePath = path.join(__dirname, "seeded.js");
    const updatedContent = `const isSeeded = ${JSON.stringify(isSeeded, null, 2)};\nmodule.exports = isSeeded;`;
    fs.writeFileSync(seededFilePath, updatedContent);
  } catch (error) {
    console.error("❌ Error seeding groups:", error);
  }
};

module.exports = seedGroups;