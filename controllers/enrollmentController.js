// controllers/enrollmentController.js
const Enrollment = require("../models/enrollmentModel.js");


// CREATE ENROLLMENT (Improved)
exports.createEnrollment = async (req, res) => {
  try {
    const { user, program, batch } = req.body;

    if (!user || !program) {
      return res.status(400).json({
        success: false,
        message: "User and Program are required",
      });
    }

    const existing = await Enrollment.findOne({ user, program });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "User already enrolled in this program",
      });
    }

    const enrollment = await Enrollment.create({
      user,
      program,
      batch,
    });

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// MY ENROLLMENTS
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate("program batch");

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ALL ENROLLMENTS (ADMIN)
exports.getAllEnrollments = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const enrollments = await Enrollment.find()
      .populate("user program batch")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Enrollment.countDocuments();

    res.json({
      success: true,
      data: enrollments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SINGLE
exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate("user program batch");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE (SAFE)
exports.updateEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteEnrollment = async (req, res) => {
  try {
    const deleted = await Enrollment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.json({
      success: true,
      message: "Enrollment deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GRADUATE
exports.graduateEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      {
        isGraduated: true,
        status: "completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SUSPEND
exports.suspendEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status: "suspended" },
      { new: true }
    );

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REACTIVATE
exports.reactivateEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};