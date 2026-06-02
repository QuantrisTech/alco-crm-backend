const mongoose = require("mongoose");

const seoMetaSchema = new mongoose.Schema(
  {
    // e.g. "home", "about", "contact", "blogs", "blogs/:slug"
    pageSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Human-readable label for admin UI
    pageLabel: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
      maxlength: 160,
    },

    description: {
      type: String,
      default: "",
      maxlength: 320,
    },

    canonical: {
      type: String,
      default: "",
    },

    robots: {
      index: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
    },

    openGraph: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      url: { type: String, default: "" },
      siteName: { type: String, default: "" },
      locale: { type: String, default: "en_US" },
      type: { type: String, default: "website" },
      image: { type: String, default: "" }, // OG image URL
    },

    twitter: {
      card: { type: String, default: "summary_large_image" },
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      image: { type: String, default: "" },
    },

    keywords: {
      type: [String],
      default: [],
    },

    // Schema.org structured data (JSON-LD) — store as raw JSON string
    structuredData: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup by slug
seoMetaSchema.index({ pageSlug: 1 });

module.exports = mongoose.model("SeoMeta", seoMetaSchema);