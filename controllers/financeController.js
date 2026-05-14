// controllers/financeController.js
const Invoice = require("../models/invoiceModel.js");
const Payment = require("../models/paymentModel.js");
const Enrollment = require("../models/enrollmentModel.js");
const Lead = require("../models/leadModel.js");
const logAudit = require("../utils/auditLogger.js");
const mongoose = require("mongoose");
const sendEmailDynamic = require("../utils/sendEmailDynamic.js");

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

    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const invoice = await Invoice.create({
      invoiceNumber,
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
      .populate({ path: "enrollment", populate: [{ path: "program", select: "name short_description" }, { path: "batch", select: "name start_date end_date" }] })
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

    // markInvoicePaid mein invoice.status = "PAID" ke baad:
    const payment = new Payment({
      invoice: invoice._id,
      enrollment: invoice.enrollment,
      user: invoice.user,
      amount: invoice.totalAmount,
      method: "manual",        // ✅ method add karo
      status: "approved",
      approvedBy: req.user._id,
      approvedAt: new Date(),
      receivedBy: req.user._id,
      notes: "Marked as fully paid manually",
    });
    await payment.save();

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

exports.markInstallmentPaid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceId, installmentId } = req.params;
    const { method, referenceNumber, notes } = req.body;

    // ── Validate method ───────────────────────────────────────────
    if (!method) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }

    if (["bank", "cheque"].includes(method) && !referenceNumber) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Reference number is required for bank/cheque payments"
      });
    }

    // ── Find invoice ──────────────────────────────────────────────
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    // ── Find installment ──────────────────────────────────────────
    const installment = invoice.installments.id(installmentId);
    if (!installment)
      return res.status(404).json({ success: false, message: "Installment not found" });

    if (installment.status === "PAID")
      return res.status(400).json({ success: false, message: "Already paid" });

    const before = invoice.toObject();

    // ── Mark installment paid ─────────────────────────────────────
    installment.status = "PAID";
    installment.paidAmount = installment.amount;
    installment.method = method;
    installment.referenceNumber = referenceNumber || null;

    // ── Recalculate invoice totals ────────────────────────────────
    const totalPaid = invoice.installments.reduce(
      (sum, inst) => sum + (inst.status === "PAID" ? inst.amount : 0), 0
    );
    invoice.paidAmount = totalPaid;
    invoice.remainingAmount = Math.max(0, invoice.totalAmount - totalPaid);
    invoice.status =
      invoice.remainingAmount === 0 ? "PAID"
        : totalPaid > 0 ? "PARTIAL"
          : "PENDING";

    await invoice.save({ session });

    // ── Payment record ────────────────────────────────────────────
    const payment = new Payment({
      invoice: invoice._id,
      enrollment: invoice.enrollment,
      user: invoice.user,
      amount: installment.amount,
      method,
      referenceNumber: referenceNumber || null,
      status: "approved",
      approvedBy: req.user._id,
      approvedAt: new Date(),
      receivedBy: req.user._id,
      notes: notes || `Payment for ${installment.label}`,
    });
    await payment.save({ session });

    // ── Audit log ─────────────────────────────────────────────────
    await logAudit({
      req,
      action: "INSTALLMENT_MARKED_PAID",
      module: "finance",
      targetId: invoice._id,
      before,
      after: invoice.toObject(),
    });

    let enrollmentActivated = false;
    let leadDeleted = false;

    // ── ADVANCE PAID — main logic ─────────────────────────────────
    if (installment.isAdvance) {

      // Overdue installments check (future pending = ok)
      const hasOverdue = invoice.installments.some(
        (inst) =>
          inst.status !== "PAID" &&
          inst.dueDate &&
          new Date(inst.dueDate) < new Date()
      );

      const enrollment = await Enrollment.findById(invoice.enrollment).populate('batch').session(session);

      if (enrollment && enrollment.accessStatus === "RESTRICTED" && !hasOverdue) {

        // ── 1. Find lead by user_id + program ─────────────────────
        // const lead = await Lead.findOne({
        //   user_id: enrollment.user,
        //   program_id: enrollment.program,
        //   status: "converted",
        // }).session(session);
        const lead = await Lead.findOneAndUpdate({
          user_id: enrollment.user,
          program_id: enrollment.program,
          status: "converted",
        }, { advance_paid: true }).session(session);

        if (lead) {
          // ── 2. Save full lead snapshot into enrollment ──────────
          enrollment.leadSnapshot = {
            paymentPlan: lead.paymentPlan || null,
            contractDetails: lead.contractDetails || null,
            source: lead.source || null,
            quality: lead.quality || null,
            opportunity_value: lead.opportunity_value || 0,
            notes: lead.notes || null,
            utm_source: lead.utm_source || null,
            utm_medium: lead.utm_medium || null,
            utm_campaign: lead.utm_campaign || null,
            lead_score: lead.lead_score || 0,
            activities: lead.activities || [],
            assigned_to: lead.assigned_to || null,
            created_by: lead.created_by || null,
            lead_id: lead._id,
          };

          // ── 3. Delete lead ──────────────────────────────────────
          await Lead.findByIdAndDelete(lead._id).session(session);
          leadDeleted = true;

          await logAudit({
            req,
            action: "LEAD_DELETED_AFTER_ENROLLMENT",
            module: "leads",
            targetId: lead._id,
            before: lead.toObject(),
            after: null,
          });
        }

        // ── 4. Activate enrollment ──────────────────────────────
        enrollment.accessStatus = "ACTIVE";
        await enrollment.save({ session });
        enrollmentActivated = true;

        await logAudit({
          req,
          action: "ENROLLMENT_ACTIVATED_ADVANCE_PAID",
          module: "finance",
          targetId: enrollment._id,
          after: { accessStatus: "ACTIVE", leadDeleted },
        });
      }
    }

    await session.commitTransaction();

    return res.json({
      success: true,
      message: enrollmentActivated
        ? `Installment paid — Enrollment activated!${leadDeleted ? " Lead record deleted." : ""}`
        : "Installment marked as paid",
      data: invoice,
      enrollmentActivated,
      leadDeleted,
    });

  } catch (err) {
    await session.abortTransaction();
    console.error("markInstallmentPaid error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// financeController.js mein add karo

// ── Installment Edit ─────────────────────────────────────────────
exports.updateInstallment = async (req, res) => {
  try {
    const { invoiceId, installmentId } = req.params;
    const { label, amount, dueDate } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    const installment = invoice.installments.id(installmentId);
    if (!installment)
      return res.status(404).json({ success: false, message: "Installment not found" });

    const before = invoice.toObject();

    if (label) installment.label = label;
    if (amount !== undefined) installment.amount = Number(amount);
    if (dueDate) installment.dueDate = new Date(dueDate);

    // Recalculate totalAmount from all installments
    const newTotal = invoice.installments.reduce(
      (sum, inst) => sum + (inst.amount || 0), 0
    );
    // invoice.totalAmount = newTotal;
    invoice.remainingAmount = Math.max(
      0,
      invoice.totalAmount - (invoice.paidAmount || 0)
    );
    // invoice.remainingAmount = Math.max(0, newTotal - (invoice.paidAmount || 0));

    await invoice.save();

    await logAudit({
      req,
      action: "INSTALLMENT_UPDATED",
      module: "finance",
      targetId: invoice._id,
      before,
      after: invoice.toObject(),
    });

    res.json({ success: true, message: "Installment updated", data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Installment Add ──────────────────────────────────────────────
exports.addInstallment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { label, amount, dueDate, isAdvance } = req.body;

    if (!label || amount === undefined)
      return res.status(400).json({ success: false, message: "label and amount are required" });

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    const before = invoice.toObject();

    invoice.installments.push({
      label,
      amount: Number(amount),
      dueDate: dueDate ? new Date(dueDate) : null,
      isAdvance: isAdvance ?? false,
      status: "PENDING",
      paidAmount: 0,
    });

    // // Recalculate totalAmount
    // const newTotal = invoice.installments.reduce(
    //   (sum, inst) => sum + (inst.amount || 0), 0
    // );
    // // invoice.totalAmount = newTotal;
    // // ❌ totalAmount ko touch nahi karna

    // // ✅ sirf remaining update karo
    // invoice.remainingAmount = Math.max(
    //   0,
    //   invoice.totalAmount - (invoice.paidAmount || 0)
    // );
    // // invoice.remainingAmount = Math.max(0, newTotal - (invoice.paidAmount || 0));

    // ✅ VALIDATION YAHAN
    const totalInstallments = invoice.installments.reduce(
      (sum, i) => sum + (i.amount || 0),
      0
    );

    if (totalInstallments > invoice.totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Installments exceed invoice total"
      });
    }

    // ✅ remaining update
    invoice.remainingAmount = Math.max(
      0,
      invoice.totalAmount - (invoice.paidAmount || 0)
    );

    await invoice.save();

    await logAudit({
      req,
      action: "INSTALLMENT_ADDED",
      module: "finance",
      targetId: invoice._id,
      before,
      after: invoice.toObject(),
    });

    res.json({ success: true, message: "Installment added", data: invoice });
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

// ─── approvePayment — FIXED (advancePaid scope issue) ────────────────────────
exports.approvePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (payment.status === "approved") return res.status(400).json({ success: false, message: "Already approved" });

    const before = payment.toObject();

    payment.status = "approved";
    payment.approvedBy = req.user.id;
    payment.approvedAt = new Date();
    await payment.save();

    // ── Invoice update ────────────────────────────────────────
    let advancePaid = false; // ✅ scope fix — upar declare karo

    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      invoice.paidAmount = (invoice.paidAmount || 0) + payment.amount;
      invoice.remainingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
      invoice.status =
        invoice.remainingAmount === 0 ? "PAID"
          : invoice.paidAmount > 0 ? "PARTIAL"
            : invoice.status;

      // Matching installment mark karo
      const matchingInst = invoice.installments.find(
        (inst) => inst.status === "PENDING" && Number(inst.amount) === Number(payment.amount)
      );
      if (matchingInst) {
        matchingInst.status = "PAID";
        matchingInst.paidAmount = payment.amount;
      }

      await invoice.save();

      // Advance paid? → Enrollment ACTIVE
      const advanceInst = invoice.installments.find((inst) => inst.isAdvance === true);
      advancePaid = advanceInst?.status === "PAID";

      if (advancePaid) {
        await Enrollment.findByIdAndUpdate(invoice.enrollment, { accessStatus: "ACTIVE" });

        await logAudit({
          req,
          action: "ENROLLMENT_ACTIVATED_ADVANCE_PAID",
          module: "finance",
          targetId: invoice.enrollment,
          after: { accessStatus: "ACTIVE" },
        });
      }
    }

    await logAudit({
      req,
      action: "PAYMENT_APPROVED",
      module: "finance",
      targetId: payment._id,
      before,
      after: payment.toObject(),
    });

    res.json({
      success: true,
      message: advancePaid ? "Payment approved — Enrollment activated!" : "Payment approved",
      data: payment,
      enrollmentActivated: advancePaid,
    });

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

// GET /api/v1/finance/invoices/my — Student apni invoices dekhe
exports.getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id })
      .populate({
        path: "enrollment",
        populate: [
          { path: "program", select: "name short_description" },
          { path: "batch", select: "start_date name" }
        ]
      })
      .sort({ createdAt: -1 });

    // Har invoice ke saath payments bhi attach karo
    const result = await Promise.all(
      invoices.map(async (inv) => {
        const payments = await Payment.find({
          invoice: inv._id,
          status: "approved",
        }).select("amount method referenceNumber createdAt").sort({ createdAt: -1 });

        return { ...inv.toObject(), payments };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email phone")
      .populate({
        path: "enrollment",
        populate: [
          { path: "program", select: "name" },
          { path: "batch", select: "name start_date end_date" },
        ],
      });

    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    const user = invoice.user;
    const program = invoice.enrollment?.program;

    const formatDate = (d) =>
      d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    const formatAmount = (n) => Number(n || 0).toLocaleString("en-PK");

    const quantity =
      invoice.enrollment?.bundle?.courses?.length ||
      invoice.enrollment?.courses?.length ||
      1;

    const installmentRows = invoice.installments
      .map((inst, i) => {
        const isAdv = inst.isAdvance;
        const isPaid = inst.status === "PAID";
        return `
        <tr style="background:${isAdv ? "#fdf6e3" : "#ffffff"}; border-bottom:1px solid #dde2ec;">
          <td style="padding:13px 16px; font-size:11px; color:#8a92a6;">${String(i + 1).padStart(2, "0")}</td>
          <td style="padding:13px 16px; font-size:13px; color:#0f1117; font-weight:700;">
            ${isAdv ? "Advance Payment" : inst.label || `Installment ${i + 1}`}
            ${isAdv ? `<span style="background:#c8a84b; color:#5a3a00; font-size:9px; font-weight:700; padding:2px 8px; border-radius:4px; margin-left:7px;">Advance</span>` : ""}
          </td>
          <td style="padding:13px 16px; font-size:11.5px; color:#4a5060;">
          ${quantity}
          </td>
          <td style="padding:13px 16px; font-size:11.5px; color:#4a5060; text-transform:capitalize;">
          ${inst.method || "—"}
          </td>

          <td style="padding:13px 16px; font-size:11.5px; color:#4a5060;">
          ${inst.referenceNumber || "—"}
          </td>
          </td>
          <td style="padding:13px 16px; font-size:11.5px; color:#4a5060;">${formatDate(inst.dueDate)}</td>
          <td style="padding:13px 16px;">
            <span style="font-size:9.5px; font-weight:700; padding:3px 9px; border-radius:5px;
              background:${isPaid ? "#eafaf3" : "#fff8e8"}; color:${isPaid ? "#1a8a57" : "#b07800"};">
              ${inst.status}
            </span>
          </td>
          <td style="padding:13px 16px; text-align:right; font-weight:600; font-size:13px;">
            Rs ${formatAmount(inst.amount)}
          </td>
        </tr>`;
      })
      .join("");

    const contractDetails = invoice.enrollment?.leadSnapshot?.contractDetails;

    await sendEmailDynamic({
      to: user.email,
      subject: `Invoice Reminder: ${invoice.invoiceNumber} | ALCO`,
      templateName: "send-invoice",
      replacements: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceStatus: invoice.status,
        issueDate: formatDate(new Date()),
        advanceDueDate: formatDate(invoice.dueDate),
        enrollmentId:
          invoice.enrollment?._id?.toString().slice(0, 8) +
          "..." +
          invoice.enrollment?._id?.toString().slice(-4),
        studentName: user.name,
        studentEmail: user.email,
        studentPhone: user.phone || "—",
        salesManagerName: "Finance Team",
        salesManagerEmail: "finance@alco.com",
        batchName: invoice.enrollment?.batch?.name || "—",
        batchStartDate: formatDate(invoice.enrollment?.batch?.start_date),
        batchEndDate: formatDate(invoice.enrollment?.batch?.end_date),
        studentCnic: contractDetails?.cnic || "—",
        studentAddress: contractDetails?.currentAddress || "—",
        studentProfession: contractDetails?.occupation || "—",
        programName: program?.name || "Program",
        planNotes: invoice.notes || "",
        installmentRows,
        totalAmount: formatAmount(invoice.totalAmount),
        paidAmount: formatAmount(invoice.paidAmount || 0),
        remainingAmount: formatAmount(invoice.remainingAmount || invoice.totalAmount),
        advanceAmount: formatAmount(
          invoice.installments.find((i) => i.isAdvance)?.amount || 0
        ),
      },
    });

    await logAudit({
      req,
      action: "INVOICE_EMAIL_SENT",
      module: "finance",
      targetId: invoice._id,
      after: { sentTo: user.email, sentAt: new Date() },
    });

    res.json({
      success: true,
      message: `Invoice email ${user.email} ko bhej diya gaya`,
    });
  } catch (err) {
    console.error("sendInvoiceEmail error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendReceivingInvoiceEmail = async (req, res) => {
  try {
    const { installmentId, paymentMethod, referenceNo, date, sendAll } = req.body;

    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email phone")
      .populate({
        path: "enrollment",
        populate: [
          { path: "program", select: "name" },
          { path: "batch", select: "name start_date end_date" },
        ],
      });

    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    const user = invoice.user;
    const program = invoice.enrollment?.program;
    const contractDetails = invoice.enrollment?.leadSnapshot?.contractDetails;

    const formatDate = (d) =>
      d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    const formatAmount = (n) => Number(n || 0).toLocaleString("en-PK");

    // ── Installments decide karo ──────────────────────────────
    let selectedInstallments = [];

    if (sendAll) {
      selectedInstallments = invoice.installments.filter(
        (inst) => inst.status === "PAID"
      );
    } else {
      const inst = invoice.installments.id(installmentId);
      if (!inst)
        return res.status(404).json({ success: false, message: "Installment not found" });
      selectedInstallments = [inst];
    }

    if (selectedInstallments.length === 0)
      return res.status(400).json({ success: false, message: "Koi paid installment nahi mili" });

    // ── Receipt rows ──────────────────────────────────────────
    // receipt rows mein method aur reference installment se lo
    const receiptRows = selectedInstallments.map((inst, i) => `
  <tr style="border-bottom:1px solid #f0f0f0;">
    <td style="padding:12px;font-size:12px;color:#8a92a6;">${i + 1}</td>
    <td style="padding:12px;font-size:13px;color:#0f1117;font-weight:600;">${invoice.invoiceNumber}</td>
    <td style="padding:12px;font-size:12px;color:#4a5060;">${formatDate(inst.dueDate)}</td>
    <td style="padding:12px;font-size:12px;color:#4a5060;">
      ${inst.isAdvance ? "Advance Payment" : inst.label || `Installment ${i + 1}`}
    </td>
    <td style="padding:12px;font-size:12px;color:#4a5060;">${inst.method || "—"}</td>
    <td style="padding:12px;font-size:12px;font-mono;color:#4a5060;">${inst.referenceNumber || "—"}</td>
    <td style="padding:12px;text-align:right;font-size:13px;font-weight:700;color:#0f1117;">
      ${formatAmount(inst.amount)}.00
    </td>
  </tr>
`).join("");


    // ── Memo row ──────────────────────────────────────────────
    const memoRow = invoice.description
      ? `<div style="font-size:11.5px;color:#4a5060;margin-bottom:8px;line-height:1.7;">
          <strong style="color:#0f1117;">Memo:</strong> ${invoice.description}
        </div>`
      : "";

    // ── Send email ────────────────────────────────────────────
    await sendEmailDynamic({
      to: user.email,
      subject: sendAll
        ? `Payment Receipt (All): ${invoice.invoiceNumber} | ALCO`
        : `Payment Receipt: ${invoice.invoiceNumber} | ALCO`,
      templateName: "send-receipt-receiving",
      replacements: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceStatus: invoice.status,
        issueDate: formatDate(new Date()),
        advanceDueDate: formatDate(invoice.dueDate),
        enrollmentId:
          invoice.enrollment?._id?.toString().slice(0, 8) +
          "..." +
          invoice.enrollment?._id?.toString().slice(-4),
        studentName: user.name,
        studentEmail: user.email,
        studentPhone: user.phone || "—",
        salesManagerName: "Finance Team",
        salesManagerEmail: "finance@alco.com",
        batchName: invoice.enrollment?.batch?.name || "—",
        batchStartDate: formatDate(invoice.enrollment?.batch?.start_date),
        batchEndDate: formatDate(invoice.enrollment?.batch?.end_date),
        studentCnic: contractDetails.cnic || "—",
        studentAddress: contractDetails?.currentAddress || "—",
        studentProfession: contractDetails?.occupation || "—",
        programName: program?.name || "Program",
        // receiptDate: formatDate(date ? new Date(date) : new Date()),
        // referenceNo: referenceNo || "—",
        // paymentMethod: paymentMethod || "—",
        installmentRows: receiptRows,
        memoRow,
        totalAmount: formatAmount(invoice.totalAmount),
        paidAmount: formatAmount(invoice.paidAmount || 0),
        // replacements mein:
        paymentMethod: selectedInstallments[0]?.method || "—",
        referenceNo: selectedInstallments[0]?.referenceNumber || "—",
        receiptDate: formatDate(new Date()),
        remainingAmount: formatAmount(invoice.remainingAmount || 0),
      },
    });

    // ── Audit log ─────────────────────────────────────────────
    await logAudit({
      req,
      action: "INVOICE_RECEIPT_EMAIL_SENT",
      module: "finance",
      targetId: invoice._id,
      after: {
        sentTo: user.email,
        sentAt: new Date(),
        installmentId: installmentId || "all",
        sendAll: !!sendAll,
      },
    });

    res.json({
      success: true,
      message: `Receipt email ${user.email} ko bhej diya gaya`,
    });
  } catch (err) {
    console.error("sendReceivingInvoiceEmail error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// exports.sendReceivingInvoiceEmail = async (req, res) => {
//   try {
//     const invoice = await Invoice.findById(req.params.id)
//       .populate("user", "name email phone")
//       .populate({
//         path: "enrollment",
//         populate: [
//           { path: "program", select: "name" },
//           { path: "batch", select: "name start_date end_date" },
//         ],
//       });

//     if (!invoice)
//       return res.status(404).json({ success: false, message: "Invoice not found" });

//     const user = invoice.user;
//     const program = invoice.enrollment?.program;

//     const formatDate = (d) =>
//       d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

//     const formatAmount = (n) => Number(n || 0).toLocaleString("en-PK");

//     const installmentRows = invoice.installments
//       .map((inst, i) => {
//         const isAdv = inst.isAdvance;
//         const isPaid = inst.status === "PAID";
//         return `
//         <tr style="background:${isAdv ? "#fdf6e3" : "#ffffff"}; border-bottom:1px solid #dde2ec;">
//           <td style="padding:13px 16px; font-size:11px; color:#8a92a6;">${String(i + 1).padStart(2, "0")}</td>
//           <td style="padding:13px 16px; font-size:13px; color:#0f1117; font-weight:700;">
//             ${isAdv ? "Advance Payment" : inst.label || `Installment ${i + 1}`}
//             ${isAdv ? `<span style="background:#c8a84b; color:#5a3a00; font-size:9px; font-weight:700; padding:2px 8px; border-radius:4px; margin-left:7px;">Advance</span>` : ""}
//           </td>
//           <td style="padding:13px 16px; font-size:11.5px; color:#4a5060;">${formatDate(inst.dueDate)}</td>
//           <td style="padding:13px 16px;">
//             <span style="font-size:9.5px; font-weight:700; padding:3px 9px; border-radius:5px;
//               background:${isPaid ? "#eafaf3" : "#fff8e8"}; color:${isPaid ? "#1a8a57" : "#b07800"};">
//               ${inst.status}
//             </span>
//           </td>
//           <td style="padding:13px 16px; text-align:right; font-weight:600; font-size:13px;">
//             Rs ${formatAmount(inst.amount)}
//           </td>
//         </tr>`;
//       })
//       .join("");

//     const contractDetails = invoice.enrollment?.leadSnapshot?.contractDetails;

//     await sendEmailDynamic({
//       to: user.email,
//       subject: `Invoice Reminder: ${invoice.invoiceNumber} | ALCO`,
//       templateName: "generate-receiving-invoice",
//       replacements: {
//         invoiceNumber: invoice.invoiceNumber,
//         invoiceStatus: invoice.status,
//         issueDate: formatDate(new Date()),
//         advanceDueDate: formatDate(invoice.dueDate),
//         enrollmentId:
//           invoice.enrollment?._id?.toString().slice(0, 8) +
//           "..." +
//           invoice.enrollment?._id?.toString().slice(-4),
//         studentName: user.name,
//         studentEmail: user.email,
//         studentPhone: user.phone || "—",
//         salesManagerName: "Finance Team",
//         salesManagerEmail: "finance@alco.com",
//         batchName: invoice.enrollment?.batch?.name || "—",
//         batchStartDate: formatDate(invoice.enrollment?.batch?.start_date),
//         batchEndDate: formatDate(invoice.enrollment?.batch?.end_date),
//         studentCnic: contractDetails?.cnic || "—",
//         studentAddress: contractDetails?.currentAddress || "—",
//         studentProfession: contractDetails?.occupation || "—",
//         programName: program?.name || "Program",
//         planNotes: invoice.notes || "",
//         installmentRows,
//         totalAmount: formatAmount(invoice.totalAmount),
//         paidAmount: formatAmount(invoice.paidAmount || 0),
//         remainingAmount: formatAmount(invoice.remainingAmount || invoice.totalAmount),
//         advanceAmount: formatAmount(
//           invoice.installments.find((i) => i.isAdvance)?.amount || 0
//         ),
//       },
//     });

//     await logAudit({
//       req,
//       action: "INVOICE_EMAIL_SENT",
//       module: "finance",
//       targetId: invoice._id,
//       after: { sentTo: user.email, sentAt: new Date() },
//     });

//     res.json({
//       success: true,
//       message: `Invoice email ${user.email} ko bhej diya gaya`,
//     });
//   } catch (err) {
//     console.error("sendInvoiceEmail error:", err.message);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
