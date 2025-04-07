// const { kafka } = require("../config/kafkaConfig.js");
// const GroupMessage = require("../models/chat_group_message.model.js");
// const pusher = require("../services/pusher_service/pusher.service.js");

// const producer = kafka.producer();
// const consumer = kafka.consumer({ groupId: "group-chat-group" });
// const admin = kafka.admin();

// const Group_Chat_Kafka = async () => {
//   try {
//     await admin.connect();
//     console.log("✅ Kafka Admin Connected");

//     // Ensure the topic exists
//     const topics = await admin.listTopics();
//     if (!topics.includes("group-chat-messages")) {
//       await admin.createTopics({
//         topics: [
//           {
//             topic: "group-chat-messages",
//             numPartitions: 1,
//             replicationFactor: 1,
//           },
//         ],
//       });
//       console.log("📌 Created Kafka topic: chat-messages");
//     }

//     await admin.disconnect();
//     await producer.connect();
//     await consumer.connect();
//     await consumer.subscribe({
//       topic: "group-chat-messages",
//       fromBeginning: false,
//     });

//     console.log("✅ Kafka Consumer Connected");

//     consumer.run({
//       eachMessage: async ({ message }) => {
//         console.log("message", message);
//         try {
//           const data = JSON.parse(message.value.toString());
//           console.log("data in group kafka", data);
//           if (!data.room_id) {
//             console.error(
//               "❌ Missing room_id in received Kafka message:",
//               data
//             );
//             return;
//           }

//           // ✅ Use Pusher to Notify Sender & Receiver
//           pusher.trigger(
//             `chat-room-${data.room_id}`,
//             "group-new-message",
//             data
//           );

//           // ✅ Save Message to PostgreSQL
//           const dbSavedData = await GroupMessage.create(data);
//           console.log("💾 Kafka Message Saved in DB:", dbSavedData);
//         } catch (err) {
//           console.error("❌ Kafka Consumer Error:", err);
//         }
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error in Kafka Setup:", error);
//   }
// };
// module.exports = { producer, Group_Chat_Kafka };
