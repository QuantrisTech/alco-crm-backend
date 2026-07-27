// controllers/financeController.js

const Invoice = require("../models/invoiceModel.js");
const Payment = require("../models/paymentModel.js");
const Enrollment = require("../models/paymentModel.js");
const logAudit = require("../utils/auditLogger.js");

// ─────────────────────────────────────────────
// INVOICE MANAGEMENT
// ─────────────────────────────────────────────

// CREATE INVOICE
exports.createInvoice = async (req, res) => {
  try {
    const { user, enrollment, totalAmount, dueDate, installments } = req.body;

    if (!user || !enrollment || !totalAmount) {
      return res.status(400).json({ success: false, message: "user, enrollment, totalAmount are required" });
    }

    const invoice = await Invoice.create({
      user,
      enrollment,
      totalAmount,
      remainingAmount: totalAmount,
      dueDate,
      installments: installments || [],
    });

    await logAudit({
      req,
      action: "INVOICE_CREATED",
      module: "finance",
      targetId: invoice._id,
      after: invoice.toObject(),
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL INVOICES (with filters)
exports.getAllInvoices = async (req, res) => {
  try {
    const { status, userId, enrollmentId, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;
    if (enrollmentId) filter.enrollment = enrollmentId;

    const invoices = await Invoice.find(filter)
      .populate("user", "name email phone")
      .populate({ path: "enrollment", populate: { path: "program", select: "name" } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      data: invoices,
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET SINGLE INVOICE
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("enrollment");

    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// MARK INVOICE AS PAID MANUALLY
exports.markInvoicePaid = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const before = invoice.toObject();

    invoice.status = "PAID";
    invoice.paidAmount = invoice.totalAmount;
    invoice.remainingAmount = 0;
    await invoice.save();

    await logAudit({
      req,
      action: "INVOICE_MARKED_PAID",
      module: "finance",
      targetId: invoice._id,
      before,
      after: invoice.toObject(),
    });

    res.json({ success: true, message: "Invoice marked as paid", data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE INVOICE
exports.updateInvoice = async (req, res) => {
  try {
    const before = await Invoice.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ success: false, message: "Invoice not found" });

    const updated = await Invoice.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });

    await logAudit({
      req,
      action: "INVOICE_UPDATED",
      module: "finance",
      targetId: updated._id,
      before,
      after: updated.toObject(),
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// PAYMENT MANAGEMENT
// ─────────────────────────────────────────────

// ADD PAYMENT (offline / manual)
exports.addPayment = async (req, res) => {
  try {
    const { invoice, enrollment, user, amount, method, referenceNumber, notes } = req.body;

    if (!invoice || !enrollment || !user || !amount || !method) {
      return res.status(400).json({ success: false, message: "invoice, enrollment, user, amount, method are required" });
    }

    const payment = await Payment.create({
      invoice,
      enrollment,
      user,
      amount,
      method,
      referenceNumber,
      notes,
      receivedBy: req.user.id,
      status: "pending",
    });

    await logAudit({
      req,
      action: "PAYMENT_ADDED",
      module: "finance",
      targetId: payment._id,
      after: payment.toObject(),
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL PAYMENTS (with filters)
exports.getAllPayments = async (req, res) => {
  try {
    const { status, method, userId, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (userId) filter.user = userId;

    const payments = await Payment.find(filter)
      .populate("user", "name email")
      .populate("invoice", "totalAmount status")
      .populate("enrollment")
      .populate("receivedBy", "name")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: payments,
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET SINGLE PAYMENT
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("user", "name email")
      .populate("invoice")
      .populate("enrollment");

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// APPROVE PAYMENT
exports.approvePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (payment.status === "approved") return res.status(400).json({ success: false, message: "Payment already approved" });

    const before = payment.toObject();

    payment.status = "approved";
    payment.approvedBy = req.user.id;
    payment.approvedAt = new Date();
    await payment.save();

    // Update invoice paidAmount and remainingAmount
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      invoice.paidAmount = (invoice.paidAmount || 0) + payment.amount;
      invoice.remainingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
      invoice.status = invoice.remainingAmount === 0 ? "PAID" : invoice.paidAmount > 0 ? "PARTIAL" : invoice.status;
      await invoice.save();
    }

    await logAudit({
      req,
      action: "PAYMENT_APPROVED",
      module: "finance",
      targetId: payment._id,
      before,
      after: payment.toObject(),
    });

    res.json({ success: true, message: "Payment approved", data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REJECT PAYMENT
exports.rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const before = payment.toObject();

    payment.status = "rejected";
    payment.rejectedBy = req.user.id;
    payment.rejectedAt = new Date();
    payment.rejectionReason = reason || "No reason provided";
    await payment.save();

    await logAudit({
      req,
      action: "PAYMENT_REJECTED",
      module: "finance",
      targetId: payment._id,
      before,
      after: payment.toObject(),
    });

    res.json({ success: true, message: "Payment rejected", data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// EDIT PAYMENT
exports.updatePayment = async (req, res) => {
  try {
    const before = await Payment.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ success: false, message: "Payment not found" });

    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await logAudit({
      req,
      action: "PAYMENT_UPDATED",
      module: "finance",
      targetId: updated._id,
      before,
      after: updated.toObject(),
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// INSTALLMENT MONITORING
// ─────────────────────────────────────────────

// PENDING INVOICES
exports.getPendingPayments = async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: { $in: ["PENDING", "PARTIAL"] } })
      .populate("user", "name email phone")
      .populate("enrollment")
      .sort({ dueDate: 1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// OVERDUE INVOICES
exports.getOverduePayments = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      status: { $in: ["OVERDUE", "PENDING", "PARTIAL"] },
      dueDate: { $lt: new Date() },
    })
      .populate("user", "name email phone")
      .populate("enrollment")
      .sort({ dueDate: 1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPCOMING DUES (next N days)
exports.getUpcomingDues = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const now = new Date();
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const invoices = await Invoice.find({
      status: { $in: ["PENDING", "PARTIAL"] },
      dueDate: { $gte: now, $lte: future },
    })
      .populate("user", "name email phone")
      .populate("enrollment")
      .sort({ dueDate: 1 });

    res.json({ success: true, count: invoices.length, daysAhead: days, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// FINANCE EXTENSION
// ─────────────────────────────────────────────

exports.addFinanceExtension = async (req, res) => {
  try {
    const { enrollmentId, days, reason } = req.body;

    if (!enrollmentId || !days) {
      return res.status(400).json({ success: false, message: "enrollmentId and days are required" });
    }

    const before = await Enrollment.findById(enrollmentId).lean();
    if (!before) return res.status(404).json({ success: false, message: "Enrollment not found" });

    const enrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        financeExtension: {
          durationDays: days,
          reason: reason || "",
          approvedBy: req.user.id,
          newDueDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        },
      },
      { new: true }
    );

    await logAudit({
      req,
      action: "FINANCE_EXTENSION_ADDED",
      module: "finance",
      targetId: enrollmentId,
      before,
      after: enrollment.toObject(),
    });

    res.json({ success: true, message: "Finance extension applied", data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// REPORTS & ANALYTICS
// ─────────────────────────────────────────────

// TOTAL REVENUE SUMMARY
exports.getRevenueReport = async (req, res) => {
  try {
    const summary = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$paidAmount" },
          totalPending: { $sum: "$remainingAmount" },
          totalInvoices: { $sum: 1 },
        },
      },
    ]);

    const byStatus = await Invoice.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      success: true,
      data: {
        summary: summary[0] || { totalRevenue: 0, totalCollected: 0, totalPending: 0, totalInvoices: 0 },
        byStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// MONTHLY COLLECTIONS
exports.getMonthlyCollections = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const monthly = await Payment.aggregate([
      {
        $match: {
          status: "approved",
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          totalCollected: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // Fill in missing months with 0
    const result = Array.from({ length: 12 }, (_, i) => {
      const found = monthly.find((m) => m._id.month === i + 1);
      return {
        month: i + 1,
        monthName: new Date(year, i, 1).toLocaleString("default", { month: "long" }),
        totalCollected: found ? found.totalCollected : 0,
        paymentCount: found ? found.paymentCount : 0,
      };
    });

    res.json({ success: true, year, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PENDING PAYMENTS REPORT
exports.getPendingReport = async (req, res) => {
  try {
    const overdue = await Invoice.find({
      status: { $in: ["OVERDUE", "PENDING", "PARTIAL"] },
    })
      .populate("user", "name email phone")
      .populate({ path: "enrollment", populate: { path: "program", select: "name" } })
      .sort({ dueDate: 1 });

    const totalOutstanding = overdue.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);

    res.json({
      success: true,
      data: { totalOutstanding, count: overdue.length, invoices: overdue },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// const Enrollment = require("../models/enrollmentModel.js");

// exports.addFinanceExtension = async (req, res) => {
//   try {
//     const { enrollmentId, days, reason } = req.body;

//     const enrollment = await Enrollment.findByIdAndUpdate(
//       enrollmentId,
//       {
//         financeExtension: {
//           durationDays: days,
//           reason,
//           approvedBy: req.user.id,
//           newDueDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
//         },
//       },
//       { new: true }
//     );

//     res.json({
//       success: true,
//       message: "Finance extension applied",
//       data: enrollment,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };