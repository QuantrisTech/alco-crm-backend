const SeoMeta = require("../models/seoMetaModal");

// ─────────────────────────────────────────────
// @desc    Get SEO data for a specific page (PUBLIC)
// @route   GET /api/v1/seo/:pageSlug
// @access  Public
// ─────────────────────────────────────────────
const getSeoBySlug = async (req, res) => {
  try {
    const { pageSlug } = req.params;

    const seo = await SeoMeta.findOne({
      pageSlug: pageSlug.toLowerCase(),
      isActive: true,
    }).select("-lastUpdatedBy -__v");

    if (!seo) {
      return res.status(404).json({
        success: false,
        message: "SEO data not found for this page",
      });
    }

    return res.status(200).json({
      success: true,
      data: seo,
    });
  } catch (error) {
    console.error("getSeoBySlug error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ─────────────────────────────────────────────
// @desc    Get ALL pages SEO data (ADMIN)
// @route   GET /api/v1/seo
// @access  Private (admin, superadmin, seo)
// ─────────────────────────────────────────────
const getAllSeo = async (req, res) => {
  try {
    const seoList = await SeoMeta.find()
      .populate("lastUpdatedBy", "name email role")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: seoList.length,
      data: seoList,
    });
  } catch (error) {
    console.error("getAllSeo error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ─────────────────────────────────────────────
// @desc    Create SEO entry for a new page
// @route   POST /api/v1/seo
// @access  Private (admin, superadmin, seo)
// ─────────────────────────────────────────────
const createSeo = async (req, res) => {
  try {
    const {
      pageSlug,
      pageLabel,
      title,
      description,
      canonical,
      robots,
      openGraph,
      twitter,
      keywords,
      structuredData,
      isActive,
    } = req.body;

    // Validate required fields
    if (!pageSlug || !pageLabel) {
      return res.status(400).json({
        success: false,
        message: "pageSlug and pageLabel are required",
      });
    }

    // Check duplicate slug
    const existing = await SeoMeta.findOne({
      pageSlug: pageSlug.toLowerCase(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `SEO entry for slug "${pageSlug}" already exists. Use update instead.`,
      });
    }

    const seo = await SeoMeta.create({
      pageSlug,
      pageLabel,
      title,
      description,
      canonical,
      robots,
      openGraph,
      twitter,
      keywords,
      structuredData,
      isActive,
      lastUpdatedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "SEO entry created successfully",
      data: seo,
    });
  } catch (error) {
    console.error("createSeo error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ─────────────────────────────────────────────
// @desc    Update SEO entry by slug
// @route   PUT /api/v1/seo/:pageSlug
// @access  Private (admin, superadmin, seo)
// ─────────────────────────────────────────────
const updateSeo = async (req, res) => {
  try {
    const { pageSlug } = req.params;

    const seo = await SeoMeta.findOne({ pageSlug: pageSlug.toLowerCase() });

    if (!seo) {
      return res.status(404).json({
        success: false,
        message: "SEO entry not found",
      });
    }

    // Update only fields that are sent
    const allowedFields = [
      "pageLabel",
      "title",
      "description",
      "canonical",
      "robots",
      "openGraph",
      "twitter",
      "keywords",
      "structuredData",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        seo[field] = req.body[field];
      }
    });

    seo.lastUpdatedBy = req.user._id;

    await seo.save();

    return res.status(200).json({
      success: true,
      message: "SEO entry updated successfully",
      data: seo,
    });
  } catch (error) {
    console.error("updateSeo error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ─────────────────────────────────────────────
// @desc    Delete SEO entry by slug
// @route   DELETE /api/v1/seo/:pageSlug
// @access  Private (superadmin only)
// ─────────────────────────────────────────────
const deleteSeo = async (req, res) => {
  try {
    const { pageSlug } = req.params;

    const seo = await SeoMeta.findOneAndDelete({
      pageSlug: pageSlug.toLowerCase(),
    });

    if (!seo) {
      return res.status(404).json({
        success: false,
        message: "SEO entry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `SEO entry for "${pageSlug}" deleted successfully`,
    });
  } catch (error) {
    console.error("deleteSeo error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ─────────────────────────────────────────────
// @desc    Upsert — create if not exists, update if exists
// @route   PATCH /api/v1/seo/upsert
// @access  Private (admin, superadmin, seo)
// ─────────────────────────────────────────────
const upsertSeo = async (req, res) => {
  try {
    const { pageSlug, ...rest } = req.body;

    if (!pageSlug) {
      return res.status(400).json({
        success: false,
        message: "pageSlug is required",
      });
    }

    const seo = await SeoMeta.findOneAndUpdate(
      { pageSlug: pageSlug.toLowerCase() },
      { ...rest, lastUpdatedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "SEO entry saved successfully",
      data: seo,
    });
  } catch (error) {
    console.error("upsertSeo error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  getSeoBySlug,
  getAllSeo,
  createSeo,
  updateSeo,
  deleteSeo,
  upsertSeo,
};