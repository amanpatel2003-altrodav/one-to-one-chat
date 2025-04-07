// // const { kafka } = require("../config/kafkaConfig");
// const Message = require("../models/chat.model");
// const pusher = require("../services/pusher_service/pusher.service");
// // const producer = kafka.producer();
// // const consumer = kafka.consumer({ groupId: "chat-group" });
// // const admin = kafka.admin();
// // Initialize Pusher
// const startKafka = async () => {
//   try {
//     await admin.connect();
//     console.log("✅ Kafka Admin Connected");
//     // Ensure the topic exists
//     const topics = await admin.listTopics();
//     if (!topics.includes("chat-messages")) {
//       await admin.createTopics({
//         topics: [
//           { topic: "chat-messages", numPartitions: 1, replicationFactor: 1 },
//         ],
//       });
//       console.log("📌 Created Kafka topic: chat-messages");
//     }
//     await admin.disconnect();
//     await producer.connect();
//     await consumer.connect();
//     await consumer.subscribe({ topic: "chat-messages", fromBeginning: false });
//     console.log("✅ Kafka Consumer Connected");
//     consumer.run({
//       eachMessage: async ({ message }) => {
//         try {
//           const data = JSON.parse(message.value.toString());
//           if (!data.room_id) {
//             console.error(
//               "❌ Missing room_id in received Kafka message:",
//               data
//             );
//             return;
//           }

//           // ✅ Use Pusher to Notify Sender & Receiver
//           pusher.trigger(`chat-room-${data.room_id}`, "new-message", data);

//           // ✅ Save Message to PostgreSQL
//           const dbSavedData = await Message.create(data);
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
// module.exports = { producer, startKafka };
