const express = require("express");
const router = express.Router();

const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  convertLead,
  setLeadToLost,
  getActivities,
  addActivity,
  getLeadsStats
} = require("../controllers/leadController.js");

const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");

// ✅ Public 
router.post("/", createLead);

// ✅ Stats rout
router.get("/stats", protect, authorize("super_admin", "admin", "sales_manager"), getLeadsStats);

// ✅ Get Leads 
router.get("/", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), getLeads);

// ✅ Get Single Lead 
router.get("/:id", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), getLeadById);

// ✅ Update Lead 
router.put("/:id", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), updateLead);

// ✅ Delete Lead 
router.delete("/:id", protect, authorize("super_admin", "admin"), deleteLead);

// ✅ Assign Lead 
router.post("/:id/assign", protect, authorize("super_admin", "admin", "sales_manager"), assignLead);

// ✅ Convert Lead 
router.post("/:id/convert", protect, authorize("super_admin", "admin", "sales_manager"), convertLead);

// ✅ Mark Lost 
router.post("/:id/mark-lost", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), setLeadToLost);

// ✅ Get Activities 
router.get("/:id/activities", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), getActivities);

// ✅ Add Activity 
router.post("/:id/activities", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), addActivity);

module.exports = router;