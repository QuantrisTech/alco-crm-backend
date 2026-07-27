// routes/financeRoute.js

const express = require("express");
const router = express.Router();

const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  markInvoicePaid,
  updateInvoice,
  addPayment,
  getAllPayments,
  getPaymentById,
  approvePayment,
  rejectPayment,
  updatePayment,
  getPendingPayments,
  getOverduePayments,
  getUpcomingDues,
  addFinanceExtension,
  getRevenueReport,
  getMonthlyCollections,
  getPendingReport,
} = require("../controllers/financeController.js");

// your existing JWT middleware
const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");
// const { isFinanceManager, isAdmin } = require("../middleware/roleMiddleware");

// ─── INVOICE ROUTES ───────────────────────────────────────────
router.post("/invoices", protect, authorize("finance_manager", "admin", "super_admin"), createInvoice);
router.get("/invoices", protect, authorize("finance_manager", "admin", "super_admin"), getAllInvoices);
router.get("/invoices/pending", protect, authorize("finance_manager", "admin", "super_admin"), getPendingPayments);
router.get("/invoices/overdue", protect, authorize("finance_manager", "admin", "super_admin"), getOverduePayments);
router.get("/invoices/upcoming-dues", protect, authorize("finance_manager", "admin", "super_admin"), getUpcomingDues);
router.get("/invoices/:id", protect, authorize("finance_manager", "admin", "super_admin"), getInvoiceById);
router.patch("/invoices/:id", protect, authorize("finance_manager", "admin", "super_admin"), updateInvoice);
router.patch("/invoices/:id/mark-paid", protect, authorize("finance_manager", "admin", "super_admin"), markInvoicePaid);

// ─── PAYMENT ROUTES ───────────────────────────────────────────
router.post("/payments", protect, authorize("finance_manager", "admin", "super_admin"), addPayment);
router.get("/payments", protect, authorize("finance_manager", "admin", "super_admin"), getAllPayments);
router.get("/payments/:id", protect, authorize("finance_manager", "admin", "super_admin"), getPaymentById);
router.patch("/payments/:id", protect, authorize("finance_manager", "admin", "super_admin"), updatePayment);
router.patch("/payments/:id/approve", protect, authorize("finance_manager", "admin", "super_admin"), approvePayment);
router.patch("/payments/:id/reject", protect, authorize("finance_manager", "admin", "super_admin"), rejectPayment);

// ─── FINANCE EXTENSION ────────────────────────────────────────
router.post("/extension", protect, authorize("finance_manager", "admin", "super_admin"), addFinanceExtension);

// ─── REPORTS (Finance Manager + Admin) ───────────────────────
router.get("/reports/revenue", protect, authorize("finance_manager", "admin", "super_admin"), getRevenueReport);
router.get("/reports/monthly", protect, authorize("finance_manager", "admin", "super_admin"), getMonthlyCollections);
router.get("/reports/pending", protect, authorize("finance_manager", "admin", "super_admin"), getPendingReport);

module.exports = router;


// const express = require("express");
// const router = express.Router();

// const {
//   addFinanceExtension,
// } = require("../controllers/financeController.js");

// const { protect, authorize } = require("../middlewares/authMiddleware.js");

// // Finance Extension (only finance/admin/super_admin)
// router.post(
//   "/extension",
//   protect,
//   authorize("finance_manager", "admin", "super_admin"),
//   addFinanceExtension
// );

// module.exports = router;