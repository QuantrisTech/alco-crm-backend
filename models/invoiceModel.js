// models/Invoice.js
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isBundle: { type: Boolean, default: false },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },

    totalAmount: Number,
    paidAmount: { type: Number, default: 0 },
    remainingAmount: Number,

    description: { type: String, default: "" },

    items: [{
      program: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
      programName: String,
      enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
      amount: Number,
    }],

    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID", "OVERDUE", "WARNING", "EXTENDED", "BLOCKED", "CANCELLED"],
      default: "PENDING",
    },

    dueDate: Date,
    issueDate: { type: Date, default: Date.now },

    installments: [{
      label: { type: String, default: "Installment" },
      amount: Number,
      dueDate: Date,
      paidAmount: { type: Number, default: 0 },
      paidAt: { type: Date, default: null },
      status: { type: String, enum: ["PENDING", "PAID", "OVERDUE"], default: "PENDING" },
      isAdvance: { type: Boolean, default: false },
      method: { type: String, enum: ["cash", "bank", "cheque", "manual"], default: null },
      referenceNumber: { type: String, default: null },
      receiptUrl: { type: String, default: null },
      receiptPublicId: { type: String, default: null },
      paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null }, // 👈 ye add karo
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);