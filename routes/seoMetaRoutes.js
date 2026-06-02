const express = require("express");
const router = express.Router();

const {
  getSeoBySlug,
  getAllSeo,
  createSeo,
  updateSeo,
  deleteSeo,
  upsertSeo,
} = require("../controllers/seoMetaController");

// ─── Import your existing auth protect middleware ───
// Adjust path according to your project structure
const { protect } = require("../middleware/authMiddleware");

// ─── SEO-specific role guards ───
const { seoAccess, superAdminOnly } = require("../middleware/seoAuth");


// ══════════════════════════════════════════════
// PUBLIC ROUTES — Frontend fetch karta hai
// ══════════════════════════════════════════════

// GET  /api/v1/seo/page/:pageSlug  → frontend pe use karo metadata fetch karne k liye
router.get("/page/:pageSlug", getSeoBySlug);


// ══════════════════════════════════════════════
// PROTECTED ROUTES — Admin Panel only
// ══════════════════════════════════════════════

// GET  /api/v1/seo              → all pages SEO list
router.get("/", protect, seoAccess, getAllSeo);

// POST /api/v1/seo              → create new SEO entry
router.post("/", protect, seoAccess, createSeo);

// PUT  /api/v1/seo/:pageSlug    → update by slug
router.put("/:pageSlug", protect, seoAccess, updateSeo);

// PATCH /api/v1/seo/upsert      → upsert (create or update)
router.patch("/upsert", protect, seoAccess, upsertSeo);

// DELETE /api/v1/seo/:pageSlug  → superadmin only
router.delete("/:pageSlug", protect, superAdminOnly, deleteSeo);


module.exports = router;