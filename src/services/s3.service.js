const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const path = require("path");
// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file to AWS S3 under structured folders: chat-media/images/, chat-media/videos/, etc.
 * @param {*} file - file object from req.files
 * @param {string} baseFolder - base S3 folder (default = "chat-media")
 * @returns {{url: string, type: string}} - public S3 URL and file type
 */
const uploadToS3 = async (file, baseFolder = "chat-media") => {
  if (!file || !file.mimetype) throw new Error("Invalid file upload");

  const fileExtension = path.extname(file.name);
  const mimeMainType = file.mimetype.split("/")[0]; // image, video, audio, etc.

  let subFolder = "others"; // fallback
  let messageType = "file";

  if (mimeMainType === "image") {
    subFolder = "images";
    messageType = "image";
  } else if (mimeMainType === "video") {
    subFolder = "videos";
    messageType = "video";
  } else if (mimeMainType === "audio") {
    subFolder = "audios";
    messageType = "audio";
  }

  const fileName = `${Date.now()}-${uuidv4()}${fileExtension}`;
  const fullKey = `${baseFolder}/${subFolder}/${fileName}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fullKey,
    Body: file.data, // Buffer from file
    ContentType: file.mimetype,
    // ACL: "public-read",
  };

  await s3.send(new PutObjectCommand(params));

  const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fullKey}`;

  return {
    url,
    type: messageType, // "image" | "video" | "audio"
  };
};

module.exports = { uploadToS3 };
