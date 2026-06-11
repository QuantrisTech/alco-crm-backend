// models/journalEntryModel.js
const mongoose = require("mongoose");
const generateUniqueNumber = require("../utils/generateUniqueNumber");

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
    lines: {
      type: [journalLineSchema],
      validate: {
        validator: function (lines) {
          if (lines.length < 2) return false;
          const totalDebit  = lines.filter(l => l.type === "debit").reduce((s, l) => s + l.amount, 0);
          const totalCredit = lines.filter(l => l.type === "credit").reduce((s, l) => s + l.amount, 0);
          return Math.abs(totalDebit - totalCredit) < 0.01;
        },
        message: "Journal entry is unbalanced — debits must equal credits",
      },
    },
    sourceType: {
      type: String,
      enum: ["payment", "invoice", "expense", "manual", "refund", "adjustment"],
      required: true,
    },
    sourceRef: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
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
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalEntry",
      default: null,
    },
    period: {
      month: Number,
      year:  Number,
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

// ✅ No DB query — timestamp + random suffix
journalEntrySchema.pre("save", function (next) {
  if (!this.entryNumber) {
    this.entryNumber = generateUniqueNumber("JE");
  }
  if (!this.period?.month) {
    const d = this.date || new Date();
    this.period = {
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
    };
  }
  next();
});

journalEntrySchema.index({ sourceType: 1, sourceRef: 1 });
journalEntrySchema.index({ "period.year": 1, "period.month": 1 });
journalEntrySchema.index({ status: 1 });
journalEntrySchema.index({ date: -1 });

module.exports = mongoose.model("JournalEntry", journalEntrySchema);