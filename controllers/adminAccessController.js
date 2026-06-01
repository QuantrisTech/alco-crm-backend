// // controllers/adminAccessController.js

// const Enrollment = require("../models/enrollmentModel.js");

// // Admin gives 1 month free access
// exports.grantAccess = async (req, res) => {
//   try {
//     const { enrollmentId, days = 30 } = req.body;

//     const enrollment = await Enrollment.findByIdAndUpdate(
//       enrollmentId,
//       {
//         accessOverride: {
//           type: "ADMIN_GRANT",
//           durationDays: days,
//           startDate: new Date(),
//           endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
//           grantedBy: req.user.id,
//         },
//       },
//       { new: true }
//     );

//     res.json({
//       success: true,
//       message: "Access granted",
//       data: enrollment,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
// controllers/adminAccessController.js
const Enrollment = require("../models/enrollmentModel.js");
const Invoice = require("../models/invoiceModel.js");
const logAudit = require("../utils/auditLogger.js");
// const createNotification = require("../utils/notificationHelper.js"); // tumhara existing notification util
const {
  notifyAccessExtended,
  notifyPoolExhausted,
} = require("../config/notificationService.js"); // naya notification service jo maine banaya hai

const FINANCE_GRACE_POOL = 90;

// ─────────────────────────────────────────────
// HELPER — Installment due dates shift karo
// ─────────────────────────────────────────────
const shiftInstallmentDates = async (enrollmentId, days, installmentIds = []) => {
  const invoice = await Invoice.findOne({ enrollment: enrollmentId });
  if (!invoice) return;

  const msToAdd = days * 24 * 60 * 60 * 1000;
  const now = new Date();

  invoice.installments.forEach((inst) => {
    if (inst.status === "PAID") return;

    const isOverdue = inst.dueDate && new Date(inst.dueDate) < now;
    const isSelected = installmentIds.includes(inst._id.toString());

    if (isOverdue) {
      // Overdue — hamesha shift, today + days
      inst.dueDate = new Date(now.getTime() + msToAdd);
    } else if (isSelected) {
      // Frontend se selected — existing date + days
      inst.dueDate = new Date(new Date(inst.dueDate).getTime() + msToAdd);
    }
  });

  await invoice.save();
};

// ─────────────────────────────────────────────
// HELPER — Admins fetch karo notification ke liye
// ─────────────────────────────────────────────
const getAdminIds = async () => {
  const admins = await User.find({
    role: { $in: ["admin", "super_admin"] },
    isActive: true,
  }).select("_id");
  return admins.map((a) => a._id);
};

// ─────────────────────────────────────────────
// ADMIN — Unlimited grace access
// ─────────────────────────────────────────────
exports.grantAccess = async (req, res) => {
  try {
    const { enrollmentId, days = 30, reason = "", installmentIds = [] } = req.body;

    if (!enrollmentId || !days) {
      return res.status(400).json({
        success: false,
        message: "enrollmentId aur days required hain",
      });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment nahi mili" });
    }

    const before = enrollment.toObject();
    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    enrollment.accessOverride = {
      type: "ADMIN_GRANT",
      startDate,
      endDate,
      grantedBy: req.user.id,
    };
    enrollment.accessStatus = "EXTENDED";
    enrollment.accessOverrideHistory.push({
      type: "ADMIN_GRANT",
      durationDays: days,
      reason,
      startDate,
      endDate,
      grantedBy: req.user.id,
    });

    await enrollment.save();

    // Installment dates shift
    await shiftInstallmentDates(enrollmentId, days, installmentIds);

    // Audit log
    await logAudit({
      req,
      action: "ADMIN_GRACE_GRANTED",
      module: "access",
      targetId: enrollmentId,
      before,
      after: enrollment.toObject(),
    });

    // User ko notification
    await notifyAccessExtended({
      userId: enrollment.user,
      days,
      triggeredBy: req.user.id,
    });

    res.json({
      success: true,
      message: `Admin ne ${days} din ka access grant kar diya`,
      data: enrollment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// FINANCE — Max 90 days pool
// ─────────────────────────────────────────────
exports.grantFinanceAccess = async (req, res) => {
  try {
    const { enrollmentId, days, reason = "", installmentIds = [] } = req.body;

    if (!enrollmentId || !days) {
      return res.status(400).json({
        success: false,
        message: "enrollmentId aur days required hain",
      });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment nahi mili" });
    }

    // ── Pool check ──────────────────────────────────────────
    const usedDays = enrollment.financeGraceDaysUsed || 0;
    const remainingPool = FINANCE_GRACE_POOL - usedDays;

    if (remainingPool <= 0) {
      return res.status(403).json({
        success: false,
        message: "Finance grace pool khatam ho gaya. Admin se contact karo.",
        poolExhausted: true,
        remainingPool: 0,
      });
    }

    if (days > remainingPool) {
      return res.status(400).json({
        success: false,
        message: `Sirf ${remainingPool} din pool mein bache hain.`,
        remainingPool,
      });
    }

    const before = enrollment.toObject();
    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    enrollment.accessOverride = {
      type: "ADMIN_GRANT", // schema enum — FINANCE_GRANT add kiya tha model mein
      startDate,
      endDate,
      grantedBy: req.user.id,
    };
    enrollment.accessStatus = "EXTENDED";
    enrollment.financeGraceDaysUsed = usedDays + days;
    enrollment.accessOverrideHistory.push({
      type: "FINANCE_GRANT",
      durationDays: days,
      reason,
      startDate,
      endDate,
      grantedBy: req.user.id,
    });

    await enrollment.save();

    // Installment dates shift
    await shiftInstallmentDates(enrollmentId, days, installmentIds);

    // Audit log
    await logAudit({
      req,
      action: "FINANCE_GRACE_GRANTED",
      module: "access",
      targetId: enrollmentId,
      before,
      after: enrollment.toObject(),
    });

    // User ko notification
    await notifyAccessExtended({
      userId: enrollment.user,
      days,
      triggeredBy: req.user.id,
    });

    const newRemaining = FINANCE_GRACE_POOL - enrollment.financeGraceDaysUsed;

    // Pool khatam — saare admins ko notify karo
    if (newRemaining <= 0) {
      const adminIds = await getAdminIds();
      await Promise.all(
        adminIds.map((adminId) =>
          notifyPoolExhausted({
            adminId,
            enrollmentId,
            triggeredBy: req.user.id,
          })
        )
      );
    }

    res.json({
      success: true,
      message: `Finance ne ${days} din ka access grant kar diya`,
      remainingPool: newRemaining,
      data: enrollment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET — Finance pool status (frontend disable ke liye)
// ─────────────────────────────────────────────
exports.getGracePoolStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId).select(
      "financeGraceDaysUsed accessStatus accessOverride accessOverrideHistory"
    );

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment nahi mili" });
    }

    const usedDays = enrollment.financeGraceDaysUsed || 0;
    const remainingPool = FINANCE_GRACE_POOL - usedDays;

    res.json({
      success: true,
      data: {
        totalPool: FINANCE_GRACE_POOL,
        usedDays,
        remainingPool,
        poolExhausted: remainingPool <= 0,
        accessStatus: enrollment.accessStatus,
        currentOverride: enrollment.accessOverride || null,
        history: enrollment.accessOverrideHistory || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};