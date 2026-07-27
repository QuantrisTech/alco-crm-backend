const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");
const {
  // Public
  getPrograms,
  getProgramBySlug,
  getProgramCurriculum,
  getProgramBatches,
  // Admin — Programs
  adminGetPrograms,
  adminCreateProgram,
  adminGetProgramById,
  adminUpdateProgram,
  adminDeleteProgram,
  adminDuplicateProgram,
  // Admin — Courses
  adminGetCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminReorderCourses,
  // Admin — Modules
  adminGetModules,
  adminCreateModule,
  adminUpdateModule,
  adminDeleteModule,
  // Admin — Lessons
  adminGetLessons,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  // Admin — Batches
  adminGetBatches,
  adminCreateBatch,
  adminUpdateBatch,
  adminDeleteBatch,
} = require("../controllers/programController.js");



// ── PUBLIC ──
router.get("/public", getPrograms);
router.get("/public/:slug", getProgramBySlug);
router.get("/public/:slug/curriculum", getProgramCurriculum);
router.get("/public/:slug/batches", getProgramBatches);

// ── ADMIN — Programs ──
router.get("/", protect, authorize("admin", "super_admin"), adminGetPrograms);
router.post("/", protect, authorize("admin", "super_admin"), adminCreateProgram);
router.get("/:id", protect, authorize("admin", "super_admin"), adminGetProgramById);
router.put("/:id", protect, authorize("admin", "super_admin"), adminUpdateProgram);
router.delete("/:id", protect, authorize("admin", "super_admin"), adminDeleteProgram);
router.post("/:id/duplicate", protect, authorize("admin", "super_admin"), adminDuplicateProgram);

// ── ADMIN — Courses ──
router.get("/:id/courses", protect, authorize("admin", "super_admin"), adminGetCourses);
router.post("/:id/courses", protect, authorize("admin", "super_admin"), adminCreateCourse);
router.put("/courses/reorder", protect, authorize("admin", "super_admin"), adminReorderCourses);
router.put("/courses/:id", protect, authorize("admin", "super_admin"), adminUpdateCourse);
router.delete("/courses/:id", protect, authorize("admin", "super_admin"), adminDeleteCourse);

// ── ADMIN — Modules ──
router.get("/courses/:id/modules", protect, authorize("admin", "super_admin"), adminGetModules);
router.post("/courses/:id/modules", protect, authorize("admin", "super_admin"), adminCreateModule);
router.put("/modules/:id", protect, authorize("admin", "super_admin"), adminUpdateModule);
router.delete("/modules/:id", protect, authorize("admin", "super_admin"), adminDeleteModule);

// ── ADMIN — Lessons ──
router.get("/modules/:id/lessons", protect, authorize("admin", "super_admin"), adminGetLessons);
router.post("/modules/:id/lessons", protect, authorize("admin", "super_admin"), adminCreateLesson);
router.put("/lessons/:id", protect, authorize("admin", "super_admin"), adminUpdateLesson);
router.delete("/lessons/:id", protect, authorize("admin", "super_admin"), adminDeleteLesson);

// ── ADMIN — Batches ──
router.get("/batches", protect, authorize("admin", "super_admin"), adminGetBatches);
router.post("/batches", protect, authorize("admin", "super_admin"), adminCreateBatch);
router.put("/batches/:id", protect, authorize("admin", "super_admin"), adminUpdateBatch);
router.delete("/batches/:id", protect, authorize("admin", "super_admin"), adminDeleteBatch);

module.exports = router;