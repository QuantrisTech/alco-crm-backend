const mongoose = require("mongoose");
const { Schema } = mongoose;

const listItemSchema = new Schema(
  {
    bold: { type: String, default: "" },
    text: { type: String, default: "" },
  },
  { _id: false }
);

const blockSchema = new Schema(
  {
    type: { type: String, enum: ["p", "h2", "h3", "quote", "ul", "ol"], required: true },
    text: { type: String },
    items: [listItemSchema],
  },
  { _id: false }
);

const guideSchema = new Schema(
  {
    pageKey: { type: String, required: true, unique: true, trim: true },
    heading: { type: String, required: true },
    description: { type: [blockSchema], default: [] },
    videoUrl: { type: String, required: true },
    videoPublicId: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Guide || mongoose.model("Guide", guideSchema);