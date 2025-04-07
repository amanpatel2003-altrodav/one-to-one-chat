const { Worker } = require("worker_threads");
const path = require("path");

class RoomIDGenerate {
    async generateRoomId(id1, id2) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.resolve(__dirname, "roomWorker.js"));
            worker.postMessage({ id1, id2 });

            worker.on("message", (message) => {
                if (message && typeof message.roomId === "string") {
                    resolve(message.roomId); // Ensure we send a string
                } else {
                    reject(new Error("Invalid roomId format received"));
                }
                worker.terminate();
            });

            worker.on("error", reject);
            worker.on("exit", (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    }
}

module.exports = new RoomIDGenerate();
