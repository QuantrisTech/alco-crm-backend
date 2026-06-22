// routes/auditRoute.js

const express = require("express");
const router = express.Router();

const { getAllAuditLogs, getAuditLogById } = require("../controllers/auditController");

const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");

// 🔧 Disable caching for audit logs — prevents 304 Not Modified with empty body
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Admin & Super Admin only
router.get("/", protect, authorize("admin", "super_admin"), getAllAuditLogs);
router.get("/:id", protect, authorize("admin", "super_admin"), getAuditLogById);

module.exports = router;