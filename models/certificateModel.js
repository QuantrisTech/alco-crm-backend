// models/Certificate.js
const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment", required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },

    certificateFee: { type: Number, default: 0 },
    feePaid: { type: Boolean, default: false },
    feePaidAt: { type: Date, default: null },
    feeType: { type: String, enum: ["program", "certificate"], default: "program" },

    courseCompleted: { type: Boolean, default: false },   // LMS progress se update hoga
    graduated: { type: Boolean, default: false },          // admin/manual graduation

    status: {
      type: String,
      enum: ["locked", "unlocked", "issued"],
      default: "locked",
    },

    certificateUrl: { type: String, default: null },       // PDF generate hone ke baad
    issuedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);