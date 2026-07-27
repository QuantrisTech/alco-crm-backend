// routes/auditRoute.js
 
const express = require("express");
const router = express.Router();
 
const { getAllAuditLogs, getAuditLogById } = require("../controllers/auditController");
// const { protect } = require("../middleware/authMiddleware");
// const { isAdmin } = require("../middleware/roleMiddleware");

const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");
 
// Admin & Super Admin only
router.get("/", protect, authorize( "admin", "super_admin"), getAllAuditLogs);
router.get("/:id", protect, authorize( "admin", "super_admin"), getAuditLogById);
 
module.exports = router;