// models/Invoice.js
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },

    totalAmount: Number,
    paidAmount: { type: Number, default: 0 },
    remainingAmount: Number,

    description: { type: String, default: "" },

    status: {
      type: String,
      enum: [
        "PENDING",
        "PARTIAL",
        "PAID",
        "OVERDUE",
        "WARNING",
        "EXTENDED",
        "BLOCKED",
      ],
      default: "PENDING",
    },

    dueDate: Date,

    installments: [{
      label: {
        type: String,
        default: "Installment"
      },
      amount: Number,
      dueDate: Date,
      paidAmount: {
        type: Number,
        default: 0
      },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "OVERDUE"],
        default: "PENDING",
      },
      isAdvance: {
        type: Boolean,
        default: false
      },
      method: {
        type: String,
        enum: ["cash", "bank", "cheque", "manual"],
        default: null
      },
      referenceNumber: {
        type: String,
        default: null
      },
      receiptUrl: { type: String, default: null },
      receiptPublicId: { type: String, default: null },
    },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);