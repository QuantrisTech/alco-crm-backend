// models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true },

    method: {
      type: String,
      enum: ["cash", "bank", "cheque", "manual"],
      required: true,
    },

    // Required for bank/cheque payments
    referenceNumber: {
      type: String,
      trim: true,
    },

    // Approval workflow
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,

    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedAt: Date,
    rejectionReason: String,

    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    notes: String,
  },
  { timestamps: true }
);

// Validate: bank/cheque must have referenceNumber
paymentSchema.pre("save", function (next) {
  if (["bank", "cheque"].includes(this.method) && !this.referenceNumber) {
    return next(new Error("Reference number is required for bank/cheque payments"));
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);

// // models/Payment.js
// const mongoose = require("mongoose");

// const paymentSchema = new mongoose.Schema(
//   {
//     invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
//     enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },

//     amount: Number,

//     method: {
//       type: String,
//       enum: ["cash", "bank", "cheque", "manual"],
//     },

//     referenceNumber: String,

//     receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     notes: String,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Payment", paymentSchema);