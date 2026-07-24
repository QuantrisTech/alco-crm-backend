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
  lmsGetResources, adminAddBook, getUserBooks,
  toggleAudioAccess
  // toggleLessonStatus
} = require("../controllers/lmsAdminController");

const isAdmin = authorize("admin", "super_admin");
const isAdminAndSeo = authorize("admin", "super_admin", "seo");
const isAdminAndSalesManager = authorize("admin", "super_admin", "sales_manager");
const isAll = authorize("admin", "super_admin", "seo" , "sales_manager");

// ✅ Public routes PEHLE — no auth
router.post("/resources/add-book",        protect, isAdminAndSalesManager, adminAddBook);
router.get("/user-books/:userId",         protect, getUserBooks);
router.get("/resources/public",          adminGetPublicResources);
router.post("/resources/:id/request",    requestBook);

// ─── Lessons ──────────────────────────────────────────────
// router.patch("lessons/:id/toggle-status", protect, authorize("admin", "super_admin"), toggleLessonStatus);
router.patch("/enrollments/:id/toggle-audio-access", protect, authorize("admin", "super_admin", "finance_manager"), toggleAudioAccess);
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
router.get   ("/resources",          protect, isAll, adminGetResources);
router.get   ("/resources/:id",      protect, isAdminAndSeo, adminGetResourceById);
router.post  ("/resources",          protect, isAdminAndSeo, uploadResourceFiles, adminCreateResource);
router.put   ("/resources/:id",      protect, isAdminAndSeo, uploadResourceFiles, adminUpdateResource);
router.delete("/resources/:id",      protect, isAdminAndSeo, adminDeleteResource);

// ─── Resources — LMS (any logged-in user) ────────────────────
router.get   ("/resources/all",      protect, lmsGetResources);


module.exports = router;