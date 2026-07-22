const express = require("express");
const router = express.Router();

const {
  createLead,
  createLeadContact,
  createLeadAdmin,
  createProgramLead,
  getMyContract,
  updateContract,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  convertLead,
  setLeadToLost,
  getActivities,
  addActivity,
  getLeadsStats,
  markInterested,
  updatePaymentPlan,
  submitContract,
  sendPaymentPlanInvoice
} = require("../controllers/leadController.js");

const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");

// ✅ Public 
router.post("/", createLead);

// ✅ Public Contact Form
router.post("/contact", createLeadContact);

router.post("/admin", createLeadAdmin);

router.post("/program", createProgramLead);

// ✅ Stats rout
router.get("/stats", protect, authorize("super_admin", "admin", "sales_manager"), getLeadsStats);

// ✅ Get My Contract 
router.get("/my-contract", protect, getMyContract);

// Admin/Sales Manager contract edit kare
router.patch("/:id/contract-edit", protect, authorize("super_admin", "admin", "sales_manager"), updateContract);


// ✅ Get Leads 
router.get("/", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep", "finance_manager"), getLeads);

// ✅ Get Single Lead 
router.get("/:id", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), getLeadById);

// ✅ Update Lead 
router.put("/:id", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), updateLead);

// ✅ Delete Lead 
router.delete("/:id", protect, authorize("super_admin", "admin"), deleteLead);

// ✅ Assign Lead 
router.post("/:id/assign", protect, authorize("super_admin", "admin", "sales_manager"), assignLead);

// ✅ Convert Lead 
router.post("/:id/convert", protect, authorize("super_admin", "admin", "sales_manager", "finance_manager"), convertLead);

// ✅ Mark Lost 
router.post("/:id/mark-lost", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), setLeadToLost);

// ✅ Get Activities 
router.get("/:id/activities", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), getActivities);

// ✅ Add Activity 
router.post("/:id/activities", protect, authorize("super_admin", "admin", "sales_manager", "sales_rep"), addActivity);

// ✅ Add Interested
router.patch("/:id/interested", protect, authorize("admin", "super_admin", "sales_manager", "sales_rep"), markInterested);

// ✅ Update Payment Plan
router.patch("/:id/payment-plan", protect, authorize("admin", "super_admin", "finance_manager", "sales_manager"), updatePaymentPlan);

// ✅ Submit Contract
router.patch("/:id/contract", protect, submitContract); // user khud call karega

router.post(
  "/:id/send-payment-plan-email",
  protect,
  authorize("admin", "super_admin", "finance_manager", "sales_manager"), sendPaymentPlanInvoice
);

module.exports = router;