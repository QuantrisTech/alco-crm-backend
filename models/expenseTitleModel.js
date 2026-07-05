// models/expenseTitleModel.js
const mongoose = require("mongoose");

const expenseTitleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // lowercase copy used purely for case-insensitive uniqueness checks
    normalizedTitle: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Always keep normalizedTitle in sync with title
expenseTitleSchema.pre("validate", function (next) {
  if (this.title) {
    this.normalizedTitle = this.title.trim().toLowerCase();
  }
  next();
});

expenseTitleSchema.index({ normalizedTitle: 1 }, { unique: true });

module.exports = mongoose.model("ExpenseTitle", expenseTitleSchema);