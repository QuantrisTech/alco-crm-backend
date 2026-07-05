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
  getAllExpenseTitles,
  createExpenseTitle,
  updateExpenseTitle,
  deleteExpenseTitle,
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
router.post("/seed", protect, adminOnly, seedAccounts);

// ─── DASHBOARD ────────────────────────────────────────────────
router.get("/dashboard", protect, financeAdmin, getAccountsDashboard);

// ─── JOURNAL ENTRIES ──────────────────────────────────────────
// ✅ Must be before /:id
router.get("/journal",  protect, financeAdmin, getAllJournalEntries);
router.post("/journal", protect, adminOnly, createJournalEntry);

router.get("/expense-titles", protect, getAllExpenseTitles);
router.post("/expense-titles", protect, createExpenseTitle);
router.patch("/expense-titles/:id", protect, updateExpenseTitle);
router.delete("/expense-titles/:id", protect, deleteExpenseTitle);

// ─── EXPENSES ─────────────────────────────────────────────────
// ✅ Must be before /:id
router.get("/expenses",  protect, financeAdmin, getAllExpenses);
router.post("/expenses", protect, financeAdmin, createExpense);
router.patch("/expenses/:id/approve", protect, financeAdmin, approveExpense);
router.patch("/expenses/:id/reject",  protect, financeAdmin, rejectExpense);

// ─── CHART OF ACCOUNTS ────────────────────────────────────────
// ✅ /:id routes LAST
router.get("/",      protect, financeAdmin, getAllAccounts);
router.post("/",     protect, adminOnly, createAccount);
router.get("/:id",   protect, financeAdmin, getAccountById);
router.patch("/:id", protect, adminOnly, updateAccount);
router.delete("/:id",protect, adminOnly, deleteAccount);

// ─── LEDGER ───────────────────────────────────────────────────
router.get("/:id/ledger", protect, financeAdmin, getAccountLedger);

module.exports = router;