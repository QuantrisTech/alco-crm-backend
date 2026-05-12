// controllers/lmsController.js
const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");
const Module = require("../models/moduleModel");
const Lesson = require("../models/lessonModel");
const LessonProgress = require("../models/lessonProgressModel");
const LessonComment = require("../models/lessonCommentModel");
const Assignment = require("../models/assignmentModel");
const Submission = require("../models/submissionModel");
const LiveSession = require("../models/liveSessionModel");
const Resource = require("../models/resourceModel");

// ─── Helper: enrollment verify karo ──────────────────────────
async function verifyEnrollment(enrollmentId, userId) {
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    user: userId,
    status: { $in: ["active", "completed"] },
  });
  return enrollment;
}

// ═══════════════════════════════════════════════════════════════
// STUDENT — LEARNING DASHBOARD
// ═══════════════════════════════════════════════════════════════

// GET /api/v1/learn/:enrollmentId/lessons/:lessonId/comments
exports.getLessonComments = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const comments = await LessonComment.find({ lesson_id: req.params.lessonId })
      .populate("user_id", "name avatarColor")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/learn/:enrollmentId/lessons/:lessonId/comments
exports.addLessonComment = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const { comment, timestamp_seconds } = req.body;
    if (!comment?.trim()) return res.status(400).json({ message: "Comment required" });

    const newComment = await LessonComment.create({
      lesson_id: req.params.lessonId,
      enrollment_id: enrollment._id,
      user_id: req.user.id,
      comment: comment.trim(),
      timestamp_seconds: timestamp_seconds || 0,
    });

    const populated = await newComment.populate("user_id", "name avatarColor");

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/learn/:enrollmentId
exports.getLearningDashboard = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const courses = await Course.find({
      program_id: enrollment.program,
      status: "active",
    }).sort({ order: 1 });

    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        const totalLessons = course.total_lessons || 0;
        const completedLessons = await LessonProgress.countDocuments({
          enrollment_id: enrollment._id,
          course_id: course._id,
          is_completed: true,
        });
        const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        // ── Modules + Lessons fetch karo ──────────────────────────
        const modules = await Module.find({ course_id: course._id }).sort({ order: 1 });

        const modulesWithLessons = await Promise.all(
          modules.map(async (mod) => {
            const lessons = await Lesson.find({
              module_id: mod._id,
              status: "active",
            }).sort({ order: 1 });

            // Har lesson ka progress
            const lessonsWithProgress = await Promise.all(
              lessons.map(async (lesson) => {
                const progress = await LessonProgress.findOne({
                  enrollment_id: enrollment._id,
                  lesson_id: lesson._id,
                });
                return {
                  ...lesson.toObject(),
                  is_completed: progress?.is_completed || false,
                  progress_percentage: progress?.progress_percentage || 0,
                  last_position_seconds: progress?.last_position_seconds || 0,
                };
              })
            );

            const modCompleted = lessonsWithProgress.filter(l => l.is_completed).length;
            const modTotal = lessons.length;

            return {
              ...mod.toObject(),
              lessons: lessonsWithProgress,
              completed_lessons: modCompleted,
              progress_percentage: modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0,
            };
          })
        );

        return {
          ...course.toObject(),
          completed_lessons: completedLessons,
          progress_percentage: progressPct,
          modules: modulesWithLessons, // ← yeh add hua
        };
      })
    );

    // Overall progress
    const totalLessons = courses.reduce((s, c) => s + (c.total_lessons || 0), 0);
    const completedTotal = await LessonProgress.countDocuments({ enrollment_id: enrollment._id, is_completed: true });
    const overallProgress = totalLessons > 0 ? Math.round((completedTotal / totalLessons) * 100) : 0;

    // Last accessed lesson
    const lastProgress = await LessonProgress.findOne({ enrollment_id: enrollment._id })
      .sort({ updatedAt: -1 })
      .populate("lesson_id", "title content_type");

    res.json({
      success: true,
      data: {
        enrollment,
        overall_progress: overallProgress,
        completed_lessons: completedTotal,
        total_lessons: totalLessons,
        last_accessed: lastProgress?.lesson_id || null,
        courses: coursesWithProgress,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/learn/:enrollmentId/courses/:courseId
exports.getCourseContent = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const course = await Course.findOne({ _id: req.params.courseId, program_id: enrollment.program });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const modules = await Module.find({ course_id: course._id }).sort({ order: 1 });

    const modulesWithLessons = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await Lesson.find({ module_id: mod._id, status: "active" })
          .select("title description content_type duration_minutes order is_free_preview resources")
          .sort({ order: 1 });

        // Progress for each lesson
        const progressRecords = await LessonProgress.find({
          enrollment_id: enrollment._id,
          module_id: mod._id,
        });
        const progressMap = {};
        progressRecords.forEach((p) => { progressMap[p.lesson_id.toString()] = p; });

        const lessonsWithProgress = lessons.map((l) => ({
          ...l.toObject(),
          progress: progressMap[l._id.toString()] || null,
        }));

        return { ...mod.toObject(), lessons: lessonsWithProgress };
      })
    );

    res.json({ success: true, data: { course, modules: modulesWithLessons } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/learn/:enrollmentId/lessons/:lessonId
exports.getLessonContent = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const lesson = await Lesson.findOne({ _id: req.params.lessonId, program_id: enrollment.program, status: "active" });
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    // Progress record
    const progress = await LessonProgress.findOne({
      enrollment_id: enrollment._id,
      lesson_id: lesson._id,
    });

    // Next / Prev lesson
    const nextLesson = await Lesson.findOne({
      module_id: lesson.module_id,
      order: { $gt: lesson.order },
      status: "active",
    }).select("_id title order").sort({ order: 1 });

    const prevLesson = await Lesson.findOne({
      module_id: lesson.module_id,
      order: { $lt: lesson.order },
      status: "active",
    }).select("_id title order").sort({ order: -1 });

    res.json({
      success: true,
      data: { lesson, progress, next_lesson: nextLesson, prev_lesson: prevLesson },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// STUDENT — PROGRESS TRACKING
// ═══════════════════════════════════════════════════════════════

// POST /api/v1/learn/:enrollmentId/lessons/:lessonId/progress
exports.updateLessonProgress = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    const { progress_percentage, last_position_seconds } = req.body;

    const progress = await LessonProgress.findOneAndUpdate(
      { enrollment_id: enrollment._id, lesson_id: lesson._id },
      {
        $set: {
          progress_percentage: Math.min(progress_percentage || 0, 100),
          last_position_seconds: last_position_seconds || 0,
          user_id: req.user.id,
          course_id: lesson.course_id,
          program_id: lesson.program_id,
        },
        $inc: { watch_time_seconds: last_position_seconds || 0 },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/learn/:enrollmentId/lessons/:lessonId/complete
exports.completeLessonProgress = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    const progress = await LessonProgress.findOneAndUpdate(
      { enrollment_id: enrollment._id, lesson_id: lesson._id },
      {
        $set: {
          progress_percentage: 100,
          is_completed: true,
          completed_at: new Date(),
          user_id: req.user.id,
          course_id: lesson.course_id,
          program_id: lesson.program_id,
        },
      },
      { upsert: true, new: true }
    );

    // Overall enrollment progress update
    const totalLessons = await Lesson.countDocuments({ program_id: enrollment.program, status: "active" });
    const completedCount = await LessonProgress.countDocuments({ enrollment_id: enrollment._id, is_completed: true });
    const overallProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    await enrollment.updateOne({ progress: overallProgress });

    res.json({ success: true, data: progress, overall_progress: overallProgress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// STUDENT — ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════

// GET /api/v1/learn/:enrollmentId/assignments
exports.getAssignments = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const assignments = await Assignment.find({
      program_id: enrollment.program,
      status: "active",
    }).sort({ due_date: 1 });

    // Har assignment ke liye student ki submission check karo
    const result = await Promise.all(
      assignments.map(async (a) => {
        const submission = await Submission.findOne({
          assignment_id: a._id,
          enrollment_id: enrollment._id,
        }).select("status points_earned submitted_at");
        return { ...a.toObject(), my_submission: submission || null };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/learn/:enrollmentId/assignments/:id
exports.getAssignmentById = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const assignment = await Assignment.findOne({ _id: req.params.id, program_id: enrollment.program });
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

    const submission = await Submission.findOne({
      assignment_id: assignment._id,
      enrollment_id: enrollment._id,
    });

    res.json({ success: true, data: { assignment, my_submission: submission } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/learn/:enrollmentId/assignments/:id/submit
exports.submitAssignment = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const assignment = await Assignment.findOne({ _id: req.params.id, program_id: enrollment.program });
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

    const { submission_type, file_url, text_content, url_content } = req.body;

    if (!submission_type) return res.status(400).json({ success: false, message: "submission_type required" });

    // Already submitted?
    const existing = await Submission.findOne({ assignment_id: assignment._id, enrollment_id: enrollment._id });
    if (existing) return res.status(409).json({ success: false, message: "Already submitted — contact instructor to resubmit" });

    const submission = await Submission.create({
      assignment_id: assignment._id,
      enrollment_id: enrollment._id,
      user_id: req.user.id,
      program_id: enrollment.program,
      submission_type,
      file_url: file_url || null,
      text_content: text_content || null,
      url_content: url_content || null,
      submitted_at: new Date(),
    });

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/learn/:enrollmentId/assignments/:id/submissions
exports.getMySubmissions = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const submissions = await Submission.find({
      assignment_id: req.params.id,
      enrollment_id: enrollment._id,
    })
      .populate("graded_by", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// STUDENT — LIVE SESSIONS
// ═══════════════════════════════════════════════════════════════

// GET /api/v1/learn/:enrollmentId/live-sessions
exports.getLiveSessions = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const sessions = await LiveSession.find({
      program_id: enrollment.program,
      status: { $in: ["scheduled", "live", "completed"] },
    })
      .populate("instructor_id", "name")
      .sort({ scheduled_at: 1 });

    // Mark which ones the user is registered for
    const result = sessions.map((s) => ({
      ...s.toObject(),
      is_registered: s.registered.some((r) => r.toString() === req.user.id),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/learn/:enrollmentId/live-sessions/:id
exports.getLiveSessionById = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const session = await LiveSession.findOne({ _id: req.params.id, program_id: enrollment.program })
      .populate("instructor_id", "name email");

    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    res.json({
      success: true,
      data: {
        ...session.toObject(),
        is_registered: session.registered.some((r) => r.toString() === req.user.id),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/learn/:enrollmentId/live-sessions/:id/register
exports.registerForLiveSession = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const session = await LiveSession.findOne({ _id: req.params.id, program_id: enrollment.program });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    if (session.registered.includes(req.user.id)) {
      return res.status(409).json({ success: false, message: "Already registered" });
    }

    if (session.registered.length >= session.max_attendees) {
      return res.status(400).json({ success: false, message: "Session is full" });
    }

    session.registered.push(req.user.id);
    await session.save();

    res.json({ success: true, message: "Registered successfully", data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// STUDENT — RESOURCES
// ═══════════════════════════════════════════════════════════════

// GET /api/v1/learn/:enrollmentId/resources
exports.getResources = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const resources = await Resource.find({ program_id: enrollment.program }).sort({ createdAt: -1 });

    res.json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/learn/:enrollmentId/resources/:id/download
exports.getResourceDownloadUrl = async (req, res) => {
  try {
    const enrollment = await verifyEnrollment(req.params.enrollmentId, req.user.id);
    if (!enrollment) return res.status(403).json({ success: false, message: "Access denied" });

    const resource = await Resource.findOne({ _id: req.params.id, program_id: enrollment.program });
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });
    if (!resource.is_downloadable) return res.status(403).json({ success: false, message: "Not downloadable" });

    res.json({ success: true, download_url: resource.file_url, title: resource.title });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// INSTRUCTOR ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET /admin/v1/instructor/courses
exports.instructorGetCourses = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ instructor_id: req.user.id }).distinct("program_id");
    const courses = await Course.find({ program_id: { $in: sessions } }).populate("program_id", "name");
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /admin/v1/instructor/sessions
exports.instructorGetSessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ instructor_id: req.user.id })
      .populate("program_id", "name")
      .sort({ scheduled_at: -1 });
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /admin/v1/instructor/assignments
exports.instructorGetAssignments = async (req, res) => {
  try {
    const mySessions = await LiveSession.find({ instructor_id: req.user.id }).distinct("program_id");
    const assignments = await Assignment.find({ program_id: { $in: mySessions }, status: "active" })
      .sort({ due_date: 1 });

    const result = await Promise.all(
      assignments.map(async (a) => {
        const total = await Submission.countDocuments({ assignment_id: a._id });
        const graded = await Submission.countDocuments({ assignment_id: a._id, status: "graded" });
        const pending = total - graded;
        return { ...a.toObject(), total_submissions: total, graded, pending };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /admin/v1/instructor/assignments/:id/submissions
exports.instructorGetSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment_id: req.params.id })
      .populate("user_id", "name email")
      .populate("enrollment_id", "enrolledAt")
      .sort({ submitted_at: -1 });

    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /admin/v1/instructor/submissions/:id/grade
exports.instructorGradeSubmission = async (req, res) => {
  try {
    const { points_earned, feedback, status } = req.body;

    if (!points_earned && points_earned !== 0) {
      return res.status(400).json({ success: false, message: "points_earned required" });
    }

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        points_earned,
        feedback: feedback || "",
        status: status || "graded",
        graded_by: req.user.id,
        graded_at: new Date(),
      },
      { new: true }
    ).populate("user_id", "name email");

    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });

    res.json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};