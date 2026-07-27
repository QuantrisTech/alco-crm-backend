// utils/auditLogger.js
 
const AuditLog = require("../models/auditModel.js");
 
/**
 * Log any action performed in the system
 *
 * @param {Object} params
 * @param {Object} params.req         - Express request object (for user + IP)
 * @param {string} params.action      - e.g. "PAYMENT_APPROVED", "INVOICE_CREATED"
 * @param {string} params.module      - e.g. "finance", "enrollment", "access"
 * @param {string} params.targetId    - ID of the document being acted upon
 * @param {Object} params.before      - State before the action (optional)
 * @param {Object} params.after       - State after the action (optional)
 */
const logAudit = async ({ req, action, module, targetId, before = null, after = null }) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";
 
    await AuditLog.create({
      user: req.user?.id || null,
      action,
      module,
      targetId: targetId?.toString() || null,
      before,
      after,
      ip,
      createdAt: new Date(),
    });
  } catch (err) {
    // Never crash the main request because of audit failure
    console.error("Audit log failed:", err.message);
  }
};
 
module.exports = logAudit;
 