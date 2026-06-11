// models/expenseModel.js
const mongoose = require("mongoose");
const generateUniqueNumber = require("../utils/generateUniqueNumber");

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "salary", "marketing", "utilities", "rent",
        "software", "travel", "equipment", "training", "other",
      ],
      required: true,
    },
    vendor: {
      name:    { type: String, default: "" },
      contact: { type: String, default: "" },
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "cheque", "online"],
      required: true,
    },
    referenceNumber: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringInterval: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "yearly", null],
      default: null,
    },
    nextDueDate: {
      type: Date,
      default: null,
    },
    attachments: [
      {
        url:      String,
        fileType: { type: String, enum: ["image", "pdf"] },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "rejected"],
      default: "pending_approval",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    journalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalEntry",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// ✅ No DB query — timestamp + random suffix
// expenseSchema.pre("save", function (next) {
//   if (!this.expenseNumber) {
//     this.expenseNumber = generateUniqueNumber("EXP");
//   }
//   next();
// });

expenseSchema.index({ status: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Expense", expenseSchema);