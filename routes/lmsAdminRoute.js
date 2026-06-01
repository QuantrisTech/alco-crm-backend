// routes/lmsAdminRoute.js
const express = require("express");
const router  = express.Router();
const { protect }   = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { uploadResourceFiles } = require("../middlewares/uploadResource");

const {
  adminGetAssignments, adminCreateAssignment, adminUpdateAssignment, adminDeleteAssignment,
  adminGetLiveSessions, adminCreateLiveSession, adminUpdateLiveSession, adminDeleteLiveSession,
  adminGetResources, adminCreateResource, adminUpdateResource, adminDeleteResource,
  adminGetResourceById, adminGetPublicResources, requestBook,
  lmsGetResources,
} = require("../controllers/lmsAdminController");

const isAdmin = authorize("admin", "super_admin");

// ─── Assignments ──────────────────────────────────────────────
router.get("/assignments",           protect, isAdmin, adminGetAssignments);
router.post("/assignments",          protect, isAdmin, adminCreateAssignment);
router.put("/assignments/:id",       protect, isAdmin, adminUpdateAssignment);
router.delete("/assignments/:id",    protect, isAdmin, adminDeleteAssignment);

// ─── Live Sessions ────────────────────────────────────────────
router.get("/live-sessions",         protect, isAdmin, adminGetLiveSessions);
router.post("/live-sessions",        protect, isAdmin, adminCreateLiveSession);
router.put("/live-sessions/:id",     protect, isAdmin, adminUpdateLiveSession);
router.delete("/live-sessions/:id",  protect, isAdmin, adminDeleteLiveSession);

// ─── Resources ────────────────────────────────────────────────
// router.get("/resources",             protect, isAdmin, adminGetResources);
// router.post("/resources",            protect, isAdmin, adminCreateResource);
// router.put("/resources/:id",         protect, isAdmin, adminUpdateResource);
// router.delete("/resources/:id",      protect, isAdmin, adminDeleteResource);

// ── Admin CRUD ───────────────────────────────────────────────
router.get   ("/resources",          protect, isAdmin, adminGetResources);
router.get   ("/resources/:id",      protect, isAdmin, adminGetResourceById);
router.post  ("/resources",          protect, isAdmin, uploadResourceFiles, adminCreateResource);
router.put   ("/resources/:id",      protect, isAdmin, uploadResourceFiles, adminUpdateResource);
router.delete("/resources/:id",      protect, isAdmin, adminDeleteResource);

// ─── Resources — LMS (any logged-in user) ────────────────────
router.get   ("/resources/all",      protect, lmsGetResources);

// Public routes for resources (no auth)
router.get   ("/resources/public",   adminGetPublicResources);
router.post  ("/resources/:id/request", requestBook);

module.exports = router;