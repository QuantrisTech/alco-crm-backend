const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");
const {
  getBlogs, getBlogBySlug,
  adminGetBlogs, adminCreateBlog,
  adminUpdateBlog, adminDeleteBlog, adminPublishBlog,
  adminGetBlogBySlug
} = require("../controllers/blogController.js");
const cloudinary = require("../config/cloudinary.js");
const multer = require("multer");

// const storage = multer.diskStorage({
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname);
//     },
// });

const upload = multer({
  storage: multer.memoryStorage(),
});

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "blog-images",
    });

    return res.json({ url: result.secure_url });

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

router.post("/upload", upload.single("image"), uploadImage);

// Public
router.get("/public", getBlogs);
router.get("/public/:slug", getBlogBySlug);

// Admin
router.get("/admin/:slug", protect, authorize("super_admin", "admin"), adminGetBlogBySlug);
router.get("/", protect, authorize("super_admin", "admin"), adminGetBlogs);
router.post("", protect, authorize("super_admin", "admin"), adminCreateBlog);
router.put("/:id", protect, authorize("super_admin", "admin"), adminUpdateBlog);
router.delete("/:id", protect, authorize("super_admin", "admin"), adminDeleteBlog);
router.post("/:id/publish", protect, authorize("super_admin", "admin"), adminPublishBlog);

module.exports = router;