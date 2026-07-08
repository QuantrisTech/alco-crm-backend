const mongoose = require("mongoose");

const pinConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "audio_access_pin",
      unique: true, // 👈 singleton guarantee
    },
    pin: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PinConfig", pinConfigSchema);