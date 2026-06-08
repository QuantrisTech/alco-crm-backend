// models/bookRequestModel.js
const mongoose = require("mongoose");

const bookRequestSchema = new mongoose.Schema(
  {
    user_id:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resource_id: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  },
  { timestamps: true }
);

// Ek user ek book ek baar hi request kar sake
bookRequestSchema.index({ user_id: 1, resource_id: 1 }, { unique: true });

module.exports = mongoose.model("BookRequest", bookRequestSchema);