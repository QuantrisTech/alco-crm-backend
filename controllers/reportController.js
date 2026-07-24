// controllers/reportController.js
const Account = require("../models/accountModel.js");
const JournalEntry = require("../models/journalEntryModel.js");
const Invoice = require("../models/invoiceModel.js");
const Payment = require("../models/paymentModel.js");
const Expense = require("../models/expenseModel.js");
const Enrollment = require("../models/enrollmentModel.js");

// ─── Helper: date range from query ───────────────────────────
const getDateRange = (query) => {
  const now = new Date();
  const year = parseInt(query.year) || now.getFullYear();

  if (query.from && query.to) {
    return { from: new Date(query.from), to: new Date(query.to) };
  }

  // Default: current year
  return {
    from: new Date(`${year}-01-01T00:00:00.000Z`),
    to:   new Date(`${year}-12-31T23:59:59.999Z`),
  };
};

// ─────────────────────────────────────────────────────────────
// 1. PROFIT & LOSS STATEMENT
// GET /api/v1/reports/profit-loss
// ─────────────────────────────────────────────────────────────
exports.getProfitLoss = async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query);

    // All posted journal entries in range
    const entries = await JournalEntry.find({
      status: "posted",
      date: { $gte: from, $lte: to },
    }).populate("lines.account", "name code type subType");

    // Aggregate by account
    const accountTotals = {};

    for (const entry of entries) {
      for (const line of entry.lines) {
        const acc = line.account;
        if (!acc) continue;
        if (!["income", "expense"].includes(acc.type)) continue;

        const key = acc._id.toString();
        if (!accountTotals[key]) {
          accountTotals[key] = {
            _id:     acc._id,
            code:    acc.code,
            name:    acc.name,
            type:    acc.type,
            subType: acc.subType,
            debit:   0,
            credit:  0,
          };
        }

        if (line.type === "debit")  accountTotals[key].debit  += line.amount;
        if (line.type === "credit") accountTotals[key].credit += line.amount;
      }
    }

    const accounts = Object.values(accountTotals);

    // Income: credit - debit (normal credit balance)
    const incomeLines = accounts
      .filter(a => a.type === "income")
      .map(a => ({ ...a, amount: a.credit - a.debit }))
      .sort((a, b) => a.code.localeCompare(b.code));

    // Expense: debit - credit (normal debit balance)
    const expenseLines = accounts
      .filter(a => a.type === "expense")
      .map(a => ({ ...a, amount: a.debit - a.credit }))
      .sort((a, b) => a.code.localeCompare(b.code));

    const totalIncome   = incomeLines.reduce((s, a) => s + a.amount, 0);
    const totalExpenses = expenseLines.reduce((s, a) => s + a.amount, 0);
    const netProfit     = totalIncome - totalExpenses;

    // Monthly breakdown for chart
    const monthlyData = await Payment.aggregate([
      {
        $match: {
          status: "approved",
          paidAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$paidAt" } },
          totalCollected: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          status: "approved",
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id:           { month: { $month: "$date" } },
          totalExpenses: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {
      const inc = monthlyData.find(m => m._id.month === i + 1);
      const exp = monthlyExpenses.find(m => m._id.month === i + 1);
      return {
        month:     i + 1,
        monthName: new Date(2000, i, 1).toLocaleString("default", { month: "short" }),
        income:    inc?.totalCollected || 0,
        expenses:  exp?.totalExpenses  || 0,
        profit:    (inc?.totalCollected || 0) - (exp?.totalExpenses || 0),
      };
    });

    res.json({
      success: true,
      data: {
        period: { from, to },
        income: {
          lines:       incomeLines,
          total:       totalIncome,
        },
        expenses: {
          lines:       expenseLines,
          total:       totalExpenses,
        },
        netProfit,
        profitMargin: totalIncome > 0
          ? ((netProfit / totalIncome) * 100).toFixed(2)
          : "0.00",
        monthlyBreakdown: months,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 2. BALANCE SHEET
// GET /api/v1/reports/balance-sheet
// ─────────────────────────────────────────────────────────────
exports.getBalanceSheet = async (req, res) => {
  try {
    // Balance sheet is at a point in time (default: today)
    const asOf = req.query.asOf ? new Date(req.query.asOf) : new Date();

    // Get all accounts with their current balances
    const accounts = await Account.find({ isActive: true })
      .sort({ code: 1 });

    const assetAccounts     = accounts.filter(a => a.type === "asset");
    const liabilityAccounts = accounts.filter(a => a.type === "liability");
    const equityAccounts    = accounts.filter(a => a.type === "equity");

    const totalAssets      = assetAccounts.reduce((s, a) => s + a.currentBalance, 0);
    const totalLiabilities = liabilityAccounts.reduce((s, a) => s + a.currentBalance, 0);
    const totalEquity      = equityAccounts.reduce((s, a) => s + a.currentBalance, 0);

    // Retained earnings = Total Income - Total Expenses (from journal)
    const incomeAccounts  = accounts.filter(a => a.type === "income");
    const expenseAccounts = accounts.filter(a => a.type === "expense");
    const retainedEarnings =
      incomeAccounts.reduce((s, a) => s + a.currentBalance, 0) -
      expenseAccounts.reduce((s, a) => s + a.currentBalance, 0);

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity + retainedEarnings;

    res.json({
      success: true,
      data: {
        asOf,
        assets: {
          lines: assetAccounts.map(a => ({
            code:    a.code,
            name:    a.name,
            subType: a.subType,
            balance: a.currentBalance,
          })),
          total: totalAssets,
        },
        liabilities: {
          lines: liabilityAccounts.map(a => ({
            code:    a.code,
            name:    a.name,
            subType: a.subType,
            balance: a.currentBalance,
          })),
          total: totalLiabilities,
        },
        equity: {
          lines: [
            ...equityAccounts.map(a => ({
              code:    a.code,
              name:    a.name,
              subType: a.subType,
              balance: a.currentBalance,
            })),
            {
              code:    "RE",
              name:    "Retained Earnings (Current Period)",
              subType: "retained_earnings",
              balance: retainedEarnings,
            },
          ],
          total: totalEquity + retainedEarnings,
        },
        totalLiabilitiesAndEquity,
        isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 3. ACCOUNTS RECEIVABLE AGING
// GET /api/v1/reports/ar-aging
// ─────────────────────────────────────────────────────────────
exports.getARAgingReport = async (req, res) => {
  try {
    const today = new Date();

    // All unpaid / partially paid invoices
    const invoices = await Invoice.find({
      status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] },
    })
      .populate("user", "name email phone")
      .populate({
        path: "enrollment",
        populate: { path: "program", select: "name" },
      })
      .sort({ dueDate: 1 });

    // Bucket each invoice
    const buckets = {
      current:  { label: "Current (not yet due)", invoices: [], total: 0 },
      days_30:  { label: "1 - 30 days",           invoices: [], total: 0 },
      days_60:  { label: "31 - 60 days",          invoices: [], total: 0 },
      days_90:  { label: "61 - 90 days",          invoices: [], total: 0 },
      days_90p: { label: "90+ days",              invoices: [], total: 0 },
    };

    for (const inv of invoices) {
      const outstanding = inv.remainingAmount || 0;
      if (outstanding <= 0) continue;

      const daysOverdue = inv.dueDate
        ? Math.floor((today - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
        : 0;

      const row = {
        invoiceNumber: inv.invoiceNumber,
        studentName:   inv.user?.name,
        studentEmail:  inv.user?.email,
        program:       inv.enrollment?.program?.name || "—",
        dueDate:       inv.dueDate,
        daysOverdue:   Math.max(0, daysOverdue),
        totalAmount:   inv.totalAmount,
        paidAmount:    inv.paidAmount || 0,
        outstanding,
        status:        inv.status,
      };

      if (daysOverdue <= 0)       { buckets.current.invoices.push(row);  buckets.current.total  += outstanding; }
      else if (daysOverdue <= 30) { buckets.days_30.invoices.push(row);  buckets.days_30.total  += outstanding; }
      else if (daysOverdue <= 60) { buckets.days_60.invoices.push(row);  buckets.days_60.total  += outstanding; }
      else if (daysOverdue <= 90) { buckets.days_90.invoices.push(row);  buckets.days_90.total  += outstanding; }
      else                        { buckets.days_90p.invoices.push(row); buckets.days_90p.total += outstanding; }
    }

    const grandTotal = Object.values(buckets).reduce((s, b) => s + b.total, 0);

    res.json({
      success: true,
      data: {
        asOf: today,
        buckets,
        grandTotal,
        summary: Object.entries(buckets).map(([key, b]) => ({
          key,
          label:   b.label,
          count:   b.invoices.length,
          total:   b.total,
          percent: grandTotal > 0
            ? ((b.total / grandTotal) * 100).toFixed(1)
            : "0.0",
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 4. CASH FLOW STATEMENT
// GET /api/v1/reports/cash-flow
// ─────────────────────────────────────────────────────────────
exports.getCashFlowReport = async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query);

    // ── Operating Activities ──────────────────────────────────
    // Cash IN: approved payments received
    const paymentsIn = await Payment.aggregate([
      {
        $match: {
          status: "approved",
          paidAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id:    "$method",
          total:  { $sum: "$amount" },
          count:  { $sum: 1 },
        },
      },
    ]);

    const totalCashIn = paymentsIn.reduce((s, p) => s + p.total, 0);

    // Cash OUT: approved expenses
    const expensesOut = await Expense.aggregate([
      {
        $match: {
          status: "approved",
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id:   "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalCashOut = expensesOut.reduce((s, e) => s + e.total, 0);
    const netCashFlow  = totalCashIn - totalCashOut;

    // ── Monthly cash flow for chart ───────────────────────────
    const monthlyIn = await Payment.aggregate([
      { $match: { status: "approved", paidAt: { $gte: from, $lte: to } } },
      { $group: { _id: { month: { $month: "$paidAt" } }, total: { $sum: "$amount" } } },
      { $sort: { "_id.month": 1 } },
    ]);

    const monthlyOut = await Expense.aggregate([
      { $match: { status: "approved", date: { $gte: from, $lte: to } } },
      { $group: { _id: { month: { $month: "$date" } }, total: { $sum: "$amount" } } },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {
      const inc = monthlyIn.find(m => m._id.month === i + 1);
      const exp = monthlyOut.find(m => m._id.month === i + 1);
      return {
        month:     i + 1,
        monthName: new Date(2000, i, 1).toLocaleString("default", { month: "short" }),
        cashIn:    inc?.total || 0,
        cashOut:   exp?.total || 0,
        net:       (inc?.total || 0) - (exp?.total || 0),
      };
    });

    // ── Opening + Closing cash balance ────────────────────────
    const cashAccount = await Account.findOne({ code: "1001" });
    const bankAccount = await Account.findOne({ code: "1002" });
    const closingCash =
      (cashAccount?.currentBalance || 0) +
      (bankAccount?.currentBalance || 0);

    res.json({
      success: true,
      data: {
        period: { from, to },
        operatingActivities: {
          cashIn: {
            lines: paymentsIn.map(p => ({
              method: p._id,
              amount: p.total,
              count:  p.count,
            })),
            total: totalCashIn,
          },
          cashOut: {
            lines: expensesOut.map(e => ({
              category: e._id,
              amount:   e.total,
              count:    e.count,
            })),
            total: totalCashOut,
          },
          netCashFlow,
        },
        closingBalance: {
          cash: cashAccount?.currentBalance || 0,
          bank: bankAccount?.currentBalance || 0,
          total: closingCash,
        },
        monthlyBreakdown: months,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 5. REVENUE BY PROGRAM
// GET /api/v1/reports/revenue-by-program
// ─────────────────────────────────────────────────────────────
exports.getRevenueByProgram = async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query);

    const result = await Payment.aggregate([
      {
        $match: {
          status: "approved",
          paidAt: { $gte: from, $lte: to },
        },
      },
      {
        $lookup: {
          from:         "enrollments",
          localField:   "enrollment",
          foreignField: "_id",
          as:           "enrollmentData",
        },
      },
      { $unwind: "$enrollmentData" },
      {
        $lookup: {
          from:         "programs",
          localField:   "enrollmentData.program",
          foreignField: "_id",
          as:           "programData",
        },
      },
      { $unwind: { path: "$programData", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:          "$programData._id",
          programName:  { $first: "$programData.name" },
          totalRevenue: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const grandTotal = result.reduce((s, r) => s + r.totalRevenue, 0);

    res.json({
      success: true,
      data: {
        period: { from, to },
        programs: result.map(r => ({
          programId:    r._id,
          programName:  r.programName || "Unknown",
          totalRevenue: r.totalRevenue,
          paymentCount: r.paymentCount,
          percent:      grandTotal > 0
            ? ((r.totalRevenue / grandTotal) * 100).toFixed(1)
            : "0.0",
        })),
        grandTotal,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};