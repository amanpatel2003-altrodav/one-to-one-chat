const express = require("express")
const pusher = require("../services/pusher_service/pusher.service");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router()
const activeUsers = new Map() // Store userId -> lastActive timestamp

// ✅ Mark user as online when they request this route
router.get("/user-status", authMiddleware.authenticate, async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    return res.status(400).json({ error: "User ID required" });
  }

  // Update active timestamp
  activeUsers.set(userId, Date.now());

  // Emit "online" status via Pusher
  await pusher.trigger("presence-active-users", "user-status", {
    userId,
    status: "online",
  });

  res.status(200).json({ success: true, message: "User is online" });
});

// ✅ Periodically remove inactive users every 30s
const checkInactiveUsers = async () => {
  const now = Date.now();
  const inactiveThreshold = 60 * 1000; // 1 minute

  for (const [userId, lastActive] of activeUsers.entries()) {
    if (now - lastActive > inactiveThreshold) {
      activeUsers.delete(userId); // Remove inactive user

      // Emit "offline" status via Pusher
      await pusher.trigger("presence-active-users", "user-status", {
        userId,
        status: "offline",
      });
    }
  }
};

// Run every 30 seconds
setInterval(checkInactiveUsers, 30 * 1000);

// ✅ Get active users list
router.get("/active-users", authMiddleware.authenticate, (req, res) => {
  res
    .status(200)
    .json({ success: true, users: Array.from(activeUsers.keys()) });
});

module.exports = router;


// const express = require("express");
// const authMiddleware = require("../middleware/authMiddleware");
// const pusher = require("../services/pusher_service/pusher.service");
// const router = express.Router();

// router.post("/pusher/auth", authMiddleware.authenticate, (req, res) => {
//   const { socket_id, channel_name } = req.body;
//   const userId = req.user.userId;

//   // Presence channels require user info
//   const presenceData = {
//     user_id: userId,
//     user_info: {
//       username: req.user.username, // Provide username for UI
//     },
//   };

//   // Authenticate the user for the presence channel
//   const authResponse = pusher.authenticate(
//     socket_id,
//     channel_name,
//     presenceData
//   );

//   res.json(authResponse); // Return authentication response
// });

// // Get active users from Pusher
// router.get("/active-users", authMiddleware.authenticate, async (req, res) => {
//   try {
//     const response = await pusher.get({
//       path: `/channels/presence-active-users/users`,
//     });

//     // ✅ Parse JSON from the response
//     const data = await response.json(); // <-- FIX HERE
//     console.log("data", data);
//     console.log("Parsed response from Pusher:", data); // Debugging step

//     // Check if users exist in the response
//     if (!data || !data.users) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Invalid response from Pusher" });
//     }

//     const activeUsers = data.users.map((user) => user.id);

//     res.status(200).json({ success: true, users: activeUsers });
//   } catch (error) {
//     console.error("Error fetching active users:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

// module.exports = router;
