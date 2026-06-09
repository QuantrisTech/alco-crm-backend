// models/journalEntryModel.js
const mongoose = require("mongoose");

/**
 * DOUBLE-ENTRY ACCOUNTING:
 * Every transaction has at least 2 lines — debit + credit
 * Total debits MUST equal total credits
 *
 * Example — Student pays Rs 10,000:
 *   DEBIT  → Bank Account        10,000
 *   CREDIT → Accounts Receivable 10,000
 */

const journalLineSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    type: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const journalEntrySchema = new mongoose.Schema(
  {
    // e.g. "JE-2025-0001"
    entryNumber: {
      type: String,
      unique: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    description: {
      type: String,
      required: true,
    },

    // Journal lines (min 2 — one debit, one credit)
    lines: {
      type: [journalLineSchema],
      validate: {
        validator: function (lines) {
          if (lines.length < 2) return false;
          const totalDebit  = lines.filter(l => l.type === "debit").reduce((s, l) => s + l.amount, 0);
          const totalCredit = lines.filter(l => l.type === "credit").reduce((s, l) => s + l.amount, 0);
          // Allow small floating point diff
          return Math.abs(totalDebit - totalCredit) < 0.01;
        },
        message: "Journal entry is unbalanced — debits must equal credits",
      },
    },

    // Source reference — what triggered this entry
    sourceType: {
      type: String,
      enum: ["payment", "invoice", "expense", "manual", "refund", "adjustment"],
      required: true,
    },

    sourceRef: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      // Can ref Invoice, Payment, or Expense
    },

    // manual = created by user, auto = system-generated
    entryType: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
    },

    status: {
      type: String,
      enum: ["posted", "draft", "reversed"],
      default: "posted",
    },

    // If this entry was reversed, link to the reversal entry
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalEntry",
      default: null,
    },

    // Period lock — entries in locked periods cannot be edited
    period: {
      month: Number,  // 1-12
      year: Number,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Auto-generate entry number before save
journalEntrySchema.pre("save", async function (next) {
  if (!this.entryNumber) {
    const count = await mongoose.model("JournalEntry").countDocuments();
    const year = new Date().getFullYear();
    this.entryNumber = `JE-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  // Auto-set period
  if (!this.period?.month) {
    const d = this.date || new Date();
    this.period = {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  }

  next();
});

// Indexes
journalEntrySchema.index({ sourceType: 1, sourceRef: 1 });
journalEntrySchema.index({ "period.year": 1, "period.month": 1 });
journalEntrySchema.index({ status: 1 });
journalEntrySchema.index({ date: -1 });

module.exports = mongoose.model("JournalEntry", journalEntrySchema);