const express = require("express");
const router = express.Router();

const {
  getGuideByPageKey,
  getAllGuides,
  upsertGuide,
  deleteGuide,
} = require("../controllers/guideController");
const { getGuideUploadSignature } = require("../controllers/uploadController");

const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");

router.get("/admin/all", protect, authorize("admin", "super_admin"), getAllGuides);
router.get("/upload-signature", protect, authorize("admin", "super_admin"), getGuideUploadSignature);
router.post("/admin", protect, authorize("admin", "super_admin"), upsertGuide);
router.delete("/admin/:id", protect, authorize("admin", "super_admin"), deleteGuide);

router.get("/:pageKey", getGuideByPageKey); // keep last

module.exports = router;