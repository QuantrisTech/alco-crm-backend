// middlewares/uploadReceipt.js
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // tumhara existing config
const streamifier = require("streamifier");

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
const uploadReceiptFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max — receipt ke liye kaafi
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP or PDF files allowed"), false);
  },
}).single("receipt"); // field name "receipt", optional hai

module.exports = { uploadReceiptFile, uploadToCloudinary };