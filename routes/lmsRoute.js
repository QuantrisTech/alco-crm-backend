// routes/lmsRoute.js
const express = require("express");
const router  = express.Router();

const { protect }    = require("../middlewares/authMiddleware");
const { authorize }  = require("../middlewares/roleMiddleware");

const {
  // Student — Dashboard
  getLearningDashboard,
  getCourseContent,
  getLessonContent,
  // Student — Progress
  updateLessonProgress,
  completeLessonProgress,
  // Student — Assignments
  getAssignments,
  getAssignmentById,
  submitAssignment,
  getMySubmissions,
  // Student — Live Sessions
  getLiveSessions,
  getLiveSessionById,
  registerForLiveSession,
  // Student — Resources
  getResources,
  getResourceDownloadUrl,
  getLessonComments,    
  addLessonComment,     

} = require("../controllers/lmsController");

// ─── Student role check ───────────────────────────────────────
const isStudent = authorize("user", "admin", "super_admin", "finance_manager");

// ═══════════════════════════════════════════════════════════════
// STUDENT ROUTES  —  /api/v1/learn
// ═══════════════════════════════════════════════════════════════

// Dashboard
router.get("/:enrollmentId",                                    protect, isStudent, getLearningDashboard);

// Course content
router.get("/:enrollmentId/courses/:courseId",                  protect, isStudent, getCourseContent);

// Lesson content
router.get("/:enrollmentId/lessons/:lessonId",                  protect, isStudent, getLessonContent);

// Progress
router.post("/:enrollmentId/lessons/:lessonId/progress",        protect, isStudent, updateLessonProgress);
router.post("/:enrollmentId/lessons/:lessonId/complete",        protect, isStudent, completeLessonProgress);

// Assignments
router.get("/:enrollmentId/assignments",                        protect, isStudent, getAssignments);
router.get("/:enrollmentId/assignments/:id",                    protect, isStudent, getAssignmentById);
router.post("/:enrollmentId/assignments/:id/submit",            protect, isStudent, submitAssignment);
router.get("/:enrollmentId/assignments/:id/submissions",        protect, isStudent, getMySubmissions);

// Live Sessions
router.get("/:enrollmentId/live-sessions",                      protect, isStudent, getLiveSessions);
router.get("/:enrollmentId/live-sessions/:id",                  protect, isStudent, getLiveSessionById);
router.post("/:enrollmentId/live-sessions/:id/register",        protect, isStudent, registerForLiveSession);

// Resources
// router.get("/:enrollmentId/resources",                          protect, isStudent, getResources);
// router.get("/:enrollmentId/resources/:id/download",             protect, isStudent, getResourceDownloadUrl);

// Comments
router.get("/:enrollmentId/lessons/:lessonId/comments", protect, getLessonComments);
router.post("/:enrollmentId/lessons/:lessonId/comments", protect, addLessonComment);

module.exports = router;