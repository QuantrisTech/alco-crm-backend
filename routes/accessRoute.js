const express = require("express");
const router = express.Router();

const { grantAccess } = require("../controllers/adminAccessController.js");

const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");
// const { protect, authorize } = require("../middlewares/authMiddleware.js");

// 🔐 Admin Free Access Grant
router.post(
  "/grant",
  protect,
  authorize("admin", "super_admin"),
  grantAccess
);

module.exports = router;