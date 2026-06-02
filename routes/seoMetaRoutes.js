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
const { protect }   = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

// ─── SEO-specific role guards ───
// const { seoAccess, superAdminOnly } = require("../middleware/seoAuth");

const isAdmin = authorize("admin", "super_admin");
const isSeo = authorize("seo", "admin", "super_admin");
// ══════════════════════════════════════════════
// PUBLIC ROUTES — Frontend fetch karta hai
// ══════════════════════════════════════════════

// GET  /api/v1/seo/page/:pageSlug  → frontend pe use karo metadata fetch karne k liye
router.get("/page/:pageSlug", getSeoBySlug);


// ══════════════════════════════════════════════
// PROTECTED ROUTES — Admin Panel only
// ══════════════════════════════════════════════

// GET  /api/v1/seo              → all pages SEO list
router.get("/", protect, isSeo, getAllSeo);

// POST /api/v1/seo              → create new SEO entry
router.post("/", protect, isSeo, createSeo);

// PUT  /api/v1/seo/:pageSlug    → update by slug
router.put("/:pageSlug", protect, isSeo, updateSeo);

// PATCH /api/v1/seo/upsert      → upsert (create or update)
router.patch("/upsert", protect, isSeo, upsertSeo);

// DELETE /api/v1/seo/:pageSlug  → superadmin only
router.delete("/:pageSlug", protect, isAdmin, deleteSeo);


module.exports = router;