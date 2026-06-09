// routes/accountRoute.js
const express = require("express");
const router = express.Router();

const {
  seedAccounts,
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountLedger,
  getAllJournalEntries,
  createJournalEntry,
  getAllExpenses,
  createExpense,
  approveExpense,
  rejectExpense,
  getAccountsDashboard,
} = require("../controllers/accountController.js");

const { protect }    = require("../middlewares/authMiddleware.js");
const { authorize }  = require("../middlewares/roleMiddleware.js");

const adminOnly    = authorize("admin", "super_admin");
const financeAdmin = authorize("admin", "super_admin", "finance_manager");

// ─── SEED ─────────────────────────────────────────────────────
// POST /api/v1/accounts/seed
router.post("/seed", protect, adminOnly, seedAccounts);

// ─── DASHBOARD ────────────────────────────────────────────────
// GET /api/v1/accounts/dashboard
router.get("/dashboard", protect, financeAdmin, getAccountsDashboard);

// ─── CHART OF ACCOUNTS ────────────────────────────────────────
// GET    /api/v1/accounts
router.get("/",     protect, financeAdmin, getAllAccounts);

// POST   /api/v1/accounts
router.post("/",    protect, adminOnly, createAccount);

// GET    /api/v1/accounts/:id
router.get("/:id",  protect, financeAdmin, getAccountById);

// PATCH  /api/v1/accounts/:id
router.patch("/:id", protect, adminOnly, updateAccount);

// DELETE /api/v1/accounts/:id
router.delete("/:id", protect, adminOnly, deleteAccount);

// ─── LEDGER ───────────────────────────────────────────────────
// GET /api/v1/accounts/:id/ledger
router.get("/:id/ledger", protect, financeAdmin, getAccountLedger);

// ─── JOURNAL ENTRIES ──────────────────────────────────────────
// GET  /api/v1/accounts/journal
router.get("/journal",  protect, financeAdmin, getAllJournalEntries);

// POST /api/v1/accounts/journal
router.post("/journal", protect, adminOnly, createJournalEntry);

// ─── EXPENSES ─────────────────────────────────────────────────
// GET  /api/v1/accounts/expenses
router.get("/expenses",  protect, financeAdmin, getAllExpenses);

// POST /api/v1/accounts/expenses
router.post("/expenses", protect, financeAdmin, createExpense);

// PATCH /api/v1/accounts/expenses/:id/approve
router.patch("/expenses/:id/approve", protect, financeAdmin, approveExpense);

// PATCH /api/v1/accounts/expenses/:id/reject
router.patch("/expenses/:id/reject",  protect, financeAdmin, rejectExpense);

module.exports = router;