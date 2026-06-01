// middlewares/uploadResource.js
const multer    = require("multer");
const cloudinary = require("../config/cloudinary"); // tumhara existing config
const streamifier = require("streamifier"); // npm i streamifier

// ── Buffer ko Cloudinary pe upload karo ──────────────────────
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ── Multer — memory mein lo (Cloudinary khud handle karega) ──
const uploadResourceFiles = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 }, // 50MB max
}).fields([
  { name: "pdf",   maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

module.exports = { uploadResourceFiles, uploadToCloudinary };