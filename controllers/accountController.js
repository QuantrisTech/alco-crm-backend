// controllers/accountController.js
const Account = require("../models/accountModel.js");
const JournalEntry = require("../models/journalEntryModel.js");
const ExpenseTitle = require("../models/expenseTitleModel.js");
const Expense = require("../models/expenseModel.js");// controllers/expenseTitleController.js
const logAudit = require("../utils/auditLogger.js");
const mongoose = require("mongoose");
const generateUniqueNumber = require("../utils/generateUniqueNumber.js");


// ─────────────────────────────────────────────────────────────
// SEED — Default Chart of Accounts
// ─────────────────────────────────────────────────────────────

const DEFAULT_ACCOUNTS = [
  // ── ASSETS ──────────────────────────────────────────────────
  { code: "1001", name: "Cash in Hand", type: "asset", subType: "cash", isSystem: true },
  { code: "1002", name: "Bank Account (HBL)", type: "asset", subType: "bank", isSystem: true },
  { code: "1003", name: "Bank Account (Meezan)", type: "asset", subType: "bank", isSystem: false },
  { code: "1100", name: "Accounts Receivable", type: "asset", subType: "accounts_receivable", isSystem: true },
  { code: "1200", name: "Other Assets", type: "asset", subType: "other_asset", isSystem: false },

  // ── LIABILITIES ──────────────────────────────────────────────
  { code: "2001", name: "Accounts Payable", type: "liability", subType: "accounts_payable", isSystem: true },
  { code: "2100", name: "Other Liabilities", type: "liability", subType: "other_liability", isSystem: false },

  // ── EQUITY ───────────────────────────────────────────────────
  { code: "3001", name: "Owner's Equity", type: "equity", subType: "owners_equity", isSystem: true },
  { code: "3002", name: "Retained Earnings", type: "equity", subType: "retained_earnings", isSystem: true },

  // ── INCOME ───────────────────────────────────────────────────
  { code: "4001", name: "Tuition Fee Income", type: "income", subType: "tuition_fee", isSystem: true },
  { code: "4002", name: "Registration Fee", type: "income", subType: "registration_fee", isSystem: true },
  { code: "4003", name: "Other Income", type: "income", subType: "other_income", isSystem: false },

  // ── EXPENSES ─────────────────────────────────────────────────
  { code: "5001", name: "Salaries & Wages", type: "expense", subType: "salary", isSystem: true },
  { code: "5002", name: "Marketing & Ads", type: "expense", subType: "marketing", isSystem: false },
  { code: "5003", name: "Utilities", type: "expense", subType: "utilities", isSystem: false },
  { code: "5004", name: "Office Rent", type: "expense", subType: "rent", isSystem: false },
  { code: "5005", name: "Software & Tools", type: "expense", subType: "software", isSystem: false },
  { code: "5006", name: "Other Expenses", type: "expense", subType: "other_expense", isSystem: false },
];

// POST /api/v1/accounts/seed
exports.seedAccounts = async (req, res) => {
  try {
    let created = 0;
    let skipped = 0;

    for (const acc of DEFAULT_ACCOUNTS) {
      const exists = await Account.findOne({ code: acc.code });
      if (exists) { skipped++; continue; }

      await Account.create({
        ...acc,
        openingBalance: 0,
        currentBalance: 0,
        createdBy: req.user._id,
      });
      created++;
    }

    res.json({
      success: true,
      message: `Seed complete — ${created} accounts created, ${skipped} already existed`,
      data: { created, skipped },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS — CRUD
// ─────────────────────────────────────────────────────────────

// GET /api/v1/accounts
exports.getAllAccounts = async (req, res) => {
  try {
    const { type, isActive, search } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) filter.name = { $regex: search, $options: "i" };

    const accounts = await Account.find(filter)
      .populate("parent", "name code")
      .populate("createdBy", "name")
      .sort({ code: 1 });

    // Group by type for frontend convenience
    const grouped = {
      asset: accounts.filter(a => a.type === "asset"),
      liability: accounts.filter(a => a.type === "liability"),
      equity: accounts.filter(a => a.type === "equity"),
      income: accounts.filter(a => a.type === "income"),
      expense: accounts.filter(a => a.type === "expense"),
    };

    res.json({ success: true, data: accounts, grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/accounts/:id
exports.getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate("parent", "name code")
      .populate("createdBy", "name");

    if (!account)
      return res.status(404).json({ success: false, message: "Account not found" });

    res.json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/accounts
exports.createAccount = async (req, res) => {
  try {
    const { code, name, type, subType, parent, description, openingBalance } = req.body;

    if (!code || !name || !type)
      return res.status(400).json({ success: false, message: "code, name, type are required" });

    const exists = await Account.findOne({ code });
    if (exists)
      return res.status(400).json({ success: false, message: `Account code ${code} already exists` });

    const account = await Account.create({
      code,
      name,
      type,
      subType: subType || null,
      parent: parent || null,
      description: description || "",
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
      createdBy: req.user._id,
    });

    await logAudit({
      req,
      action: "ACCOUNT_CREATED",
      module: "accounts",
      targetId: account._id,
      after: account.toObject(),
    });

    res.status(201).json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/accounts/:id
exports.updateAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account)
      return res.status(404).json({ success: false, message: "Account not found" });

    // System accounts — sirf name aur description change ho sakta hai
    const allowedFields = account.isSystem
      ? ["name", "description"]
      : ["name", "description", "subType", "parent", "isActive", "openingBalance"];

    const before = account.toObject();
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) account[field] = req.body[field];
    });

    await account.save();

    await logAudit({
      req,
      action: "ACCOUNT_UPDATED",
      module: "accounts",
      targetId: account._id,
      before,
      after: account.toObject(),
    });

    res.json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/accounts/:id
exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account)
      return res.status(404).json({ success: false, message: "Account not found" });

    if (account.isSystem)
      return res.status(400).json({ success: false, message: "System accounts cannot be deleted" });

    if (account.currentBalance !== 0)
      return res.status(400).json({ success: false, message: "Cannot delete account with non-zero balance" });

    // Check if used in any journal entry
    const usedInJournal = await JournalEntry.findOne({ "lines.account": account._id });
    if (usedInJournal)
      return res.status(400).json({ success: false, message: "Account has journal entries — deactivate instead of deleting" });

    await account.deleteOne();

    await logAudit({
      req,
      action: "ACCOUNT_DELETED",
      module: "accounts",
      targetId: account._id,
      before: account.toObject(),
    });

    res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// LEDGER — Account transactions history
// ─────────────────────────────────────────────────────────────

// GET /api/v1/accounts/:id/ledger
exports.getAccountLedger = async (req, res) => {
  try {
    const { from, to, page = 1, limit = 20 } = req.query;
    const accountId = req.params.id;

    const account = await Account.findById(accountId);
    if (!account)
      return res.status(404).json({ success: false, message: "Account not found" });

    // Date filter
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const journalFilter = {
      "lines.account": new mongoose.Types.ObjectId(accountId),
      status: "posted",
      ...(Object.keys(dateFilter).length && { date: dateFilter }),
    };

    const total = await JournalEntry.countDocuments(journalFilter);

    const entries = await JournalEntry.find(journalFilter)
      .populate("createdBy", "name")
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Build ledger lines — only this account's lines from each entry
    let runningBalance = account.openingBalance;
    const ledgerLines = [];

    // We need ascending order for running balance
    const allEntries = await JournalEntry.find(journalFilter).sort({ date: 1 });

    for (const entry of allEntries) {
      const relevantLines = entry.lines.filter(
        l => l.account.toString() === accountId
      );

      for (const line of relevantLines) {
        const isDebitNormal = ["asset", "expense"].includes(account.type);

        if (line.type === "debit") {
          runningBalance += isDebitNormal ? line.amount : -line.amount;
        } else {
          runningBalance += isDebitNormal ? -line.amount : line.amount;
        }

        ledgerLines.push({
          date: entry.date,
          entryNumber: entry.entryNumber,
          description: entry.description,
          sourceType: entry.sourceType,
          debit: line.type === "debit" ? line.amount : 0,
          credit: line.type === "credit" ? line.amount : 0,
          balance: runningBalance,
        });
      }
    }

    res.json({
      success: true,
      data: {
        account: { _id: account._id, code: account.code, name: account.name, type: account.type },
        openingBalance: account.openingBalance,
        currentBalance: account.currentBalance,
        ledger: ledgerLines,
      },
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// JOURNAL ENTRIES — Manual entry + view
// ─────────────────────────────────────────────────────────────

// GET /api/v1/accounts/journal
exports.getAllJournalEntries = async (req, res) => {
  try {
    const { sourceType, from, to, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (sourceType) filter.sourceType = sourceType;
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const total = await JournalEntry.countDocuments(filter);
    const entries = await JournalEntry.find(filter)
      .populate("lines.account", "name code type")
      .populate("createdBy", "name")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: entries,
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/accounts/journal — Manual journal entry
exports.createJournalEntry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { description, date, lines, notes } = req.body;

    if (!description || !lines || lines.length < 2)
      return res.status(400).json({ success: false, message: "description and at least 2 lines required" });

    // Validate all accounts exist
    for (const line of lines) {
      const acc = await Account.findById(line.account);
      if (!acc)
        return res.status(400).json({ success: false, message: `Account ${line.account} not found` });
    }

    const entry = await JournalEntry.create([{
      description,
      date: date ? new Date(date) : new Date(),
      lines,
      sourceType: "manual",
      entryType: "manual",
      status: "posted",
      createdBy: req.user._id,
      notes: notes || "",
      entryNumber: generateUniqueNumber("JE"),
      period: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    }], { session });

    // Update account balances
    for (const line of lines) {
      const account = await Account.findById(line.account).session(session);
      const isDebitNormal = ["asset", "expense"].includes(account.type);

      const delta = line.type === "debit"
        ? (isDebitNormal ? line.amount : -line.amount)
        : (isDebitNormal ? -line.amount : line.amount);

      account.currentBalance += delta;
      await account.save({ session });
    }

    await logAudit({
      req,
      action: "JOURNAL_ENTRY_CREATED",
      module: "accounts",
      targetId: entry[0]._id,
      after: entry[0].toObject(),
    });

    await session.commitTransaction();
    res.status(201).json({ success: true, data: entry[0] });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};



// ─────────────────────────────────────────────────────────────
// GET /api/v1/accounts/expense-titles
// ─────────────────────────────────────────────────────────────
exports.getAllExpenseTitles = async (req, res) => {
  try {
    const titles = await ExpenseTitle.find({ isActive: true }).sort({ title: 1 });
    res.json({ success: true, data: titles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/v1/accounts/expense-titles
// ─────────────────────────────────────────────────────────────
exports.createExpenseTitle = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: "Title is required" });

    const normalized = title.trim().toLowerCase();

    // duplicate check (case-insensitive)
    const exists = await ExpenseTitle.findOne({ normalizedTitle: normalized });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `"${title.trim()}" already exists`,
      });
    }

    const expenseTitle = await ExpenseTitle.create({
      title: title.trim(),
      normalizedTitle: normalized,
      titleNumber: generateUniqueNumber("Exp-Title"),
      createdBy: req.user._id,
    });

    await logAudit({
      req,
      action: "EXPENSE_TITLE_CREATED",
      module: "accounts",
      targetId: expenseTitle._id,
      after: expenseTitle.toObject(),
    });

    res.status(201).json({ success: true, data: expenseTitle });
  } catch (err) {
    // handle race-condition duplicate key errors from the unique index
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "This title already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/accounts/expense-titles/:id
// ─────────────────────────────────────────────────────────────
exports.updateExpenseTitle = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: "Title is required" });

    const expenseTitle = await ExpenseTitle.findById(req.params.id);
    if (!expenseTitle)
      return res.status(404).json({ success: false, message: "Expense title not found" });

    const normalized = title.trim().toLowerCase();

    // duplicate check — ignore self
    const exists = await ExpenseTitle.findOne({
      normalizedTitle: normalized,
      _id: { $ne: expenseTitle._id },
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `"${title.trim()}" already exists`,
      });
    }

    const before = expenseTitle.toObject();
    expenseTitle.title = title.trim();
    expenseTitle.normalizedTitle = normalized;
    await expenseTitle.save();

    await logAudit({
      req,
      action: "EXPENSE_TITLE_UPDATED",
      module: "accounts",
      targetId: expenseTitle._id,
      before,
      after: expenseTitle.toObject(),
    });

    res.json({ success: true, data: expenseTitle });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "This title already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/v1/accounts/expense-titles/:id
// ─────────────────────────────────────────────────────────────
exports.deleteExpenseTitle = async (req, res) => {
  try {
    const expenseTitle = await ExpenseTitle.findById(req.params.id);
    if (!expenseTitle)
      return res.status(404).json({ success: false, message: "Expense title not found" });

    // If this title is already used on real expenses, don't hard-delete —
    // just deactivate it so history / reporting stays intact.
    const usedInExpense = await Expense.findOne({ title: expenseTitle.title });
    if (usedInExpense) {
      expenseTitle.isActive = false;
      await expenseTitle.save();

      await logAudit({
        req,
        action: "EXPENSE_TITLE_DEACTIVATED",
        module: "accounts",
        targetId: expenseTitle._id,
        after: expenseTitle.toObject(),
      });

      return res.json({
        success: true,
        message: "Title is used in existing expenses — deactivated instead of deleted",
      });
    }

    await expenseTitle.deleteOne();

    await logAudit({
      req,
      action: "EXPENSE_TITLE_DELETED",
      module: "accounts",
      targetId: expenseTitle._id,
      before: expenseTitle.toObject(),
    });

    res.json({ success: true, message: "Expense title deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// EXPENSES — Full CRUD + approval
// ─────────────────────────────────────────────────────────────

// GET /api/v1/accounts/expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const { status, category, from, to, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .populate("account", "name code")
      .populate("createdBy", "name")
      .populate("approvedBy", "name")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalAmount = await Expense.aggregate([
      { $match: { ...filter, status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      data: expenses,
      meta: {
        page: Number(page), limit: Number(limit), total,
        totalPages: Math.ceil(total / limit),
        totalApprovedAmount: totalAmount[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/accounts/expenses
// exports.createExpense = async (req, res) => {
//   try {
//     const {
//       title, description, amount, account, category,
//       vendor, paymentMethod, referenceNumber, date,
//       isRecurring, recurringInterval, notes,
//     } = req.body;

//     if (!title || !amount || !account || !category || !paymentMethod)
//       return res.status(400).json({ success: false, message: "title, amount, account, category, paymentMethod are required" });

//     const accExists = await Account.findById(account);
//     if (!accExists || accExists.type !== "expense")
//       return res.status(400).json({ success: false, message: "Valid expense account required" });

//     const expense = await Expense.create({
//       title, description, amount, account, category,
//       vendor: vendor || {},
//       paymentMethod, referenceNumber,
//       date: date ? new Date(date) : new Date(),
//       isRecurring: isRecurring || false,
//       recurringInterval: recurringInterval || null,
//       notes: notes || "",
//       status: "pending_approval",
//       createdBy: req.user._id,
//     });

//     await logAudit({
//       req,
//       action: "EXPENSE_CREATED",
//       module: "accounts",
//       targetId: expense._id,
//       after: expense.toObject(),
//     });

//     res.status(201).json({ success: true, data: expense });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
exports.createExpense = async (req, res) => {
  try {
    const {
      title, description, amount, account, category,
      vendor, paymentMethod, referenceNumber, date,
      isRecurring, recurringInterval, notes,
    } = req.body;

    if (!title || !amount || !account || !category || !paymentMethod)
      return res.status(400).json({ success: false, message: "title, amount, account, category, paymentMethod are required" });

    const accExists = await Account.findById(account);
    if (!accExists || accExists.type !== "expense")
      return res.status(400).json({ success: false, message: "Valid expense account required" });

    const expense = new Expense({
      title, description, amount, account, category,
      vendor: vendor || {},
      paymentMethod, referenceNumber,
      date: date ? new Date(date) : new Date(),
      isRecurring: isRecurring || false,
      recurringInterval: recurringInterval || null,
      notes: notes || "",
      status: "pending_approval",
      createdBy: req.user._id,
      expenseNumber: generateUniqueNumber("EXP"),
    });

    await expense.save();

    await logAudit({
      req,
      action: "EXPENSE_CREATED",
      module: "accounts",
      targetId: expense._id,
      after: expense.toObject(),
    });

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    console.error("createExpense error:", err); // ← full stack
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/accounts/expenses/:id/approve
exports.approveExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const expense = await Expense.findById(req.params.id).session(session);
    if (!expense)
      return res.status(404).json({ success: false, message: "Expense not found" });

    if (expense.status === "approved")
      return res.status(400).json({ success: false, message: "Already approved" });

    const before = expense.toObject();

    // Find cash/bank account to credit
    const cashAccount = await Account.findOne({ code: "1001", isActive: true }).session(session);
    const expenseAccount = await Account.findById(expense.account).session(session);

    if (!cashAccount || !expenseAccount)
      return res.status(400).json({ success: false, message: "Cash or expense account not found" });

    // Auto-post journal entry:
    // DEBIT  Expense Account  (increases expense)
    // CREDIT Cash in Hand     (decreases cash)
    // const entry = await JournalEntry.create([{
    //   description: `Expense: ${expense.title}`,
    //   date: expense.date,
    //   lines: [
    //     { account: expenseAccount._id, type: "debit", amount: expense.amount, description: expense.title },
    //     { account: cashAccount._id, type: "credit", amount: expense.amount, description: expense.title },
    //   ],
    //   sourceType: "expense",
    //   sourceRef: expense._id,
    //   entryType: "auto",
    //   status: "posted",
    //   createdBy: req.user._id,
    // }], { session });
    const entry = await JournalEntry.create([{
      description: `Expense: ${expense.title}`,
      date: expense.date,
      lines: [
        { account: expenseAccount._id, type: "debit", amount: expense.amount, description: expense.title },
        { account: cashAccount._id, type: "credit", amount: expense.amount, description: expense.title },
      ],
      sourceType: "expense",
      sourceRef: expense._id,
      entryType: "auto",
      status: "posted",
      createdBy: req.user._id,
      entryNumber: generateUniqueNumber("JE"),  // ✅ yeh add karo
      period: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    }], { session });

    // Update balances
    expenseAccount.currentBalance += expense.amount;
    cashAccount.currentBalance -= expense.amount;
    await expenseAccount.save({ session });
    await cashAccount.save({ session });

    // Update expense status
    expense.status = "approved";
    expense.approvedBy = req.user._id;
    expense.approvedAt = new Date();
    expense.journalEntry = entry[0]._id;
    await expense.save({ session });

    await logAudit({
      req,
      action: "EXPENSE_APPROVED",
      module: "accounts",
      targetId: expense._id,
      before,
      after: expense.toObject(),
    });

    await session.commitTransaction();
    res.json({ success: true, message: "Expense approved and journal entry posted", data: expense });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// PATCH /api/v1/accounts/expenses/:id/reject
exports.rejectExpense = async (req, res) => {
  try {
    const { reason } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense)
      return res.status(404).json({ success: false, message: "Expense not found" });

    const before = expense.toObject();
    expense.status = "rejected";
    expense.rejectedBy = req.user._id;
    expense.rejectionReason = reason || "No reason provided";
    await expense.save();

    await logAudit({
      req,
      action: "EXPENSE_REJECTED",
      module: "accounts",
      targetId: expense._id,
      before,
      after: expense.toObject(),
    });

    res.json({ success: true, message: "Expense rejected", data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD — Financial KPIs summary
// ─────────────────────────────────────────────────────────────

// GET /api/v1/accounts/dashboard
exports.getAccountsDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total income accounts balance
    const incomeAccounts = await Account.find({ type: "income", isActive: true });
    const expenseAccounts = await Account.find({ type: "expense", isActive: true });
    const assetAccounts = await Account.find({ type: "asset", isActive: true });

    const totalIncome = incomeAccounts.reduce((s, a) => s + a.currentBalance, 0);
    const totalExpenses = expenseAccounts.reduce((s, a) => s + a.currentBalance, 0);
    const totalAssets = assetAccounts.reduce((s, a) => s + a.currentBalance, 0);
    const netProfit = totalIncome - totalExpenses;

    // This month's journal entries
    const monthlyEntries = await JournalEntry.countDocuments({
      status: "posted",
      date: { $gte: startOfMonth },
    });

    // Pending expenses
    const pendingExpenses = await Expense.countDocuments({ status: "pending_approval" });
    const pendingExpenseAmount = await Expense.aggregate([
      { $match: { status: "pending_approval" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        totalAssets,
        netProfit,
        monthlyJournalEntries: monthlyEntries,
        pendingExpenses: {
          count: pendingExpenses,
          amount: pendingExpenseAmount[0]?.total || 0,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};