// controllers/adminAccessController.js

const Enrollment = require("../models/enrollmentModel.js");

// Admin gives 1 month free access
exports.grantAccess = async (req, res) => {
  try {
    const { enrollmentId, days = 30 } = req.body;

    const enrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        accessOverride: {
          type: "ADMIN_GRANT",
          durationDays: days,
          startDate: new Date(),
          endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          grantedBy: req.user.id,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Access granted",
      data: enrollment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};