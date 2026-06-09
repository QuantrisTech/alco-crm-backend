// models/accountModel.js
const mongoose = require("mongoose");

/**
 * ACCOUNT TYPES (QuickBooks-style):
 * Asset     → bank, cash, receivable
 * Liability → payable, credit
 * Equity    → owner's equity
 * Income    → revenue, fees
 * Expense   → salaries, utilities, marketing
 */

const accountSchema = new mongoose.Schema(
  {
    // e.g. "1001", "2001", "4001"
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["asset", "liability", "equity", "income", "expense"],
      required: true,
    },

    // Sub-type for better categorization
    subType: {
      type: String,
      enum: [
        // Asset
        "cash", "bank", "accounts_receivable", "other_asset",
        // Liability
        "accounts_payable", "other_liability",
        // Equity
        "owners_equity", "retained_earnings",
        // Income
        "tuition_fee", "registration_fee", "other_income",
        // Expense
        "salary", "marketing", "utilities", "rent", "software", "other_expense",
      ],
      default: null,
    },

    // Parent account (for hierarchy e.g. "Bank" → "HBL Account")
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    description: {
      type: String,
      default: "",
    },

    // Opening balance when account was created
    openingBalance: {
      type: Number,
      default: 0,
    },

    // Current running balance (updated on every journal entry)
    currentBalance: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "PKR",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // System accounts cannot be deleted (e.g. Accounts Receivable, Revenue)
    isSystem: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index for fast lookup
accountSchema.index({ type: 1, isActive: 1 });
accountSchema.index({ code: 1 });

module.exports = mongoose.model("Account", accountSchema);