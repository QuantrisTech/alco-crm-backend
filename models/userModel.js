const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      // enum: ["admin", "sales_manager", "sales", "support", "finance_manager", "user"],
      enum: [
        "super_admin",
        "admin",
        "sales_manager",
        "sales_rep",
        "support",
        "finance_manager",
        "user"
      ],

      default: "user",

    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    isPaid: {
      type: Boolean,
      default: false
    },

    isTemporaryPassword: {
      type: Boolean,
      default: false
    },

    permissions: {
      type: [String],
      default: []
    },

    avatarColor: {
      type: String,
      default: null
    },

    lastLogin: {
      type: Date,
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    resetPasswordAttempts: { type: Number, default: 0 },
    refreshToken: {
      type: String,
      default: null,
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);