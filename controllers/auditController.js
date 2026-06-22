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
    const { userId, module, action, from, to, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (userId) filter.user = userId;
    if (module) filter.module = module;

    // 🔎 Smart action search — handles spaces, underscores, partial text, case-insensitive
    if (action) {
      // User type kare "lead converted" ya "Lead_Converted" ya "LEAD CONVERTED" — sab match ho
      const normalized = action.trim().replace(/[\s_]+/g, "[\\s_]+");
      filter.action = new RegExp(normalized, "i");
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

    res.set("Cache-Control", "no-store"); // 🔧 Reset/304 crash fix bhi yahin laga diya
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