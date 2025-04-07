const { parentPort } = require("worker_threads");

parentPort.on("message", ({ id1, id2 }) => {
    // Ensure `roomId` is a string
    const roomId = [id1, id2].sort().join("-");
    
    // Send the response as an object with a key
    parentPort.postMessage({ roomId });
});
