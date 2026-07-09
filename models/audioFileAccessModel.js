const mongoose = require("mongoose");

const audioFileAccessSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, default: "", trim: true },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      default: null,
    },

    isAlready: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ["access-request", "resource", "other"],
      default: "access-request",
    },

    // ✅ ab real Program IDs store hongi, hardcoded strings nahi
    programsRequested: [
      {
        program: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Program",
          required: true,
        },
        isAlready: {
          type: Boolean,
          default: false, // true agr user already enrolled hy is program mein
        },
        status: {
          type: String,
          enum: ["pending", "enrolled", "rejected"],
          default: "pending",
        },
        rejectReason: {
          type: String,
          default: null,
        },
      },
    ],

    programsGranted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program",
      },
    ],

    accessStatus: {
      type: String,
      enum: ["pending", "granted", "rejected"],
      default: "pending",
    },

    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    grantedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

audioFileAccessSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("AudioFileAccess", audioFileAccessSchema);