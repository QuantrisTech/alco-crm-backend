// routes/reportRoute.js
const express = require("express");
const router  = express.Router();

const {
  getProfitLoss,
  getBalanceSheet,
  getARAgingReport,
  getCashFlowReport,
  getRevenueByProgram,
} = require("../controllers/reportController.js");

const { protect }   = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");

const financeAdmin = authorize("admin", "super_admin", "finance_manager");

// GET /api/v1/reports/profit-loss?year=2025
// GET /api/v1/reports/profit-loss?from=2025-01-01&to=2025-06-30
router.get("/profit-loss",       protect, financeAdmin, getProfitLoss);

// GET /api/v1/reports/balance-sheet
// GET /api/v1/reports/balance-sheet?asOf=2025-06-30
router.get("/balance-sheet",     protect, financeAdmin, getBalanceSheet);

// GET /api/v1/reports/ar-aging
router.get("/ar-aging",          protect, financeAdmin, getARAgingReport);

// GET /api/v1/reports/cash-flow?year=2025
router.get("/cash-flow",         protect, financeAdmin, getCashFlowReport);

// GET /api/v1/reports/revenue-by-program?year=2025
router.get("/revenue-by-program", protect, financeAdmin, getRevenueByProgram);

module.exports = router;