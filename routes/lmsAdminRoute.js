// routes/lmsAdminRoute.js
const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const cloudinary = require("../config/cloudinary");
const { protect }   = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

const {
  adminGetAssignments, adminCreateAssignment, adminUpdateAssignment, adminDeleteAssignment,
  adminGetLiveSessions, adminCreateLiveSession, adminUpdateLiveSession, adminDeleteLiveSession,
  adminGetResources, adminCreateResource, adminUpdateResource, adminDeleteResource,
  adminGetResourceById, adminGetPublicResources, requestBook, lmsGetResources,
} = require("../controllers/lmsAdminController");

const isAdmin = authorize("admin", "super_admin");
const upload  = multer({ storage: multer.memoryStorage() });

// ── Upload helpers ────────────────────────────────────────────
const uploadResourceImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const base64  = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;
    const result  = await cloudinary.uploader.upload(dataUri, {
      folder: "alco/resources/covers",
    });
    return res.json({ url: result.secure_url });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const uploadResourcePdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const base64  = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;
    const result  = await cloudinary.uploader.upload(dataUri, {
      folder:        "alco/resources/pdfs",
      resource_type: "raw",
    });
    return res.json({ url: result.secure_url });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── Assignments ──────────────────────────────────────────────
router.get   ("/assignments",      protect, isAdmin, adminGetAssignments);
router.post  ("/assignments",      protect, isAdmin, adminCreateAssignment);
router.put   ("/assignments/:id",  protect, isAdmin, adminUpdateAssignment);
router.delete("/assignments/:id",  protect, isAdmin, adminDeleteAssignment);

// ─── Live Sessions ────────────────────────────────────────────
router.get   ("/live-sessions",      protect, isAdmin, adminGetLiveSessions);
router.post  ("/live-sessions",      protect, isAdmin, adminCreateLiveSession);
router.put   ("/live-sessions/:id",  protect, isAdmin, adminUpdateLiveSession);
router.delete("/live-sessions/:id",  protect, isAdmin, adminDeleteLiveSession);

// ─── Resources — static routes PEHLE /:id se ─────────────────
router.post("/resources/upload-image", protect, isAdmin, upload.single("image"), uploadResourceImage);
router.post("/resources/upload-pdf",   protect, isAdmin, upload.single("pdf"),   uploadResourcePdf);
router.get ("/resources/all",          protect, lmsGetResources);
router.get ("/resources/public",       adminGetPublicResources);
router.post("/resources/:id/request",  requestBook);

// ─── Resources — Admin CRUD ───────────────────────────────────
router.get   ("/resources",      protect, isAdmin, adminGetResources);
router.post  ("/resources",      protect, isAdmin, adminCreateResource);
router.get   ("/resources/:id",  protect, isAdmin, adminGetResourceById);
router.put   ("/resources/:id",  protect, isAdmin, adminUpdateResource);
router.delete("/resources/:id",  protect, isAdmin, adminDeleteResource);

module.exports = router;