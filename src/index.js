const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const messageRoutes = require("./routes/private_chat.routes");
const groupMessageRoutes = require("./routes/group_chat.routes");
const activeUsersRoutes = require("./routes/active_users.routes");
const isSeeded = require("./seeders/seeded");
const seedGroups = require("./seeders/seedGroups");
const seedMessages = require("./seeders/seedMessage");
const seedGroupMessages = require("./seeders/seedGroupMessage");
const seedGroupUsers = require("./seeders/seedGroupUser");
const sequelize = require("./config/database");
// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
console.log("✅ Registering Auth Routes...");
app.use("/api/active", activeUsersRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/Groupmessage", groupMessageRoutes);

const runSeeders = async () => {
  try {
    // Check and run each seeder based on the isSeeded object
    if (!isSeeded.SeedGroups) {
      console.log("Running 'seedGroups'...");
      await seedGroups();
    }

    if (!isSeeded.seedMessages) {
      console.log("Running 'seedMessages'...");
      await seedMessages();
    }

    if (!isSeeded.isSeedGroupMessages) {
      console.log("Running 'seedGroupMessages'...");
      await seedGroupMessages();
    }

    if (!isSeeded.seedGroupUsers) {
      console.log("Running 'seedGroupUsers'...");
      await seedGroupUsers();
    }

    console.log("✅ All seeders executed successfully!");
  } catch (error) {
    console.error("❌ Error running seeders:", error);
  }
};

// Database Connection
sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log("Database connected and synchronized");

    // Activate this when seeding activities data
    // await seedActivitiesFromCSV();

    // Run seeders
    await runSeeders();

    // Start Kafka (if needed)
    // try {
    //   await startKafka();
    //   await Group_Chat_Kafka();
    // } catch (error) {
    //   console.error("❌ Kafka connection failed:", error);
    // }
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = { app };
