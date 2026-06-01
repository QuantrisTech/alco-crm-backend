// middleware/uploadResource.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary"); // tumhara existing cloudinary config

// PDF storage
const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        "alco/resources/pdfs",
    resource_type: "raw",   // PDF ke liye raw zaroori hai
    allowed_formats: ["pdf"],
  },
});

// Image storage
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "alco/resources/covers",
    resource_type:   "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadPdf   = multer({ storage: pdfStorage });
const uploadImage = multer({ storage: imageStorage });

// Single request mein dono fields handle karo
const uploadResourceFiles = multer({
  storage: multer.memoryStorage(), // pehle memory mein lo
}).fields([
  { name: "pdf",   maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

module.exports = { uploadPdf, uploadImage, uploadResourceFiles };