// controllers/auditController.js

const AuditLog = require("../models/auditModel.js");

// GET ALL AUDIT LOGS (Admin / Super Admin only)
// exports.getAllAuditLogs = async (req, res) => {
//   try {
//     const { userId, module, action, from, to, page = 1, limit = 20 } = req.query;

//     const filter = {};
//     if (userId) filter.user = userId;
//     if (module) filter.module = module;
//     if (action) filter.action = new RegExp(action, "i");
//     if (from || to) {
//       filter.createdAt = {};
//       if (from) filter.createdAt.$gte = new Date(from);
//       if (to) filter.createdAt.$lte = new Date(to);
//     }

//     const logs = await AuditLog.find(filter)
//       .populate("user", "name email role")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     const total = await AuditLog.countDocuments(filter);

//     res.json({
//       success: true,
//       data: logs,
//       meta: {
//         page: Number(page),
//         limit: Number(limit),
//         total,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
exports.getAllAuditLogs = async (req, res) => {
  try {
    const { userId, module, action, performedBy, from, to, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (userId) filter.user = userId;

    // 🔎 Smart module search — case-insensitive partial match
    if (module) {
      filter.module = new RegExp(module.trim(), "i");
    }

    // 🔎 Smart action search — word-by-word match, spaces/underscores dono handle
    if (action) {
      const words = action.trim().split(/[\s_]+/).filter(Boolean);
      filter.$and = (filter.$and || []).concat(
        words.map((w) => ({ action: new RegExp(w, "i") }))
      );
    }

    // 🔎 Performed By search — user ka name/email/role se match
    if (performedBy) {
      const performedByRegex = new RegExp(performedBy.trim(), "i");

      const matchingUsers = await User.find({
        $or: [
          { name: performedByRegex },
          { first_name: performedByRegex },
          { last_name: performedByRegex },
          { email: performedByRegex },
          { role: performedByRegex },
        ],
      }).select("_id");

      const matchingUserIds = matchingUsers.map((u) => u._id);

      // Agar koi user match nahi hua, to empty result return karo (System logs ko bhi consider kar sakte ho agar "system" type kare)
      filter.user = { $in: matchingUserIds };
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const logs = await AuditLog.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      data: logs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET SINGLE AUDIT LOG
exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate("user", "name email role");
    if (!log) return res.status(404).json({ success: false, message: "Audit log not found" });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};