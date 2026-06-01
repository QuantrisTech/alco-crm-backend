// const express = require("express");
// const router = express.Router();

// const { grantAccess } = require("../controllers/adminAccessController.js");

// const { protect } = require("../middlewares/authMiddleware.js");
// const { authorize } = require("../middlewares/roleMiddleware.js");
// // const { protect, authorize } = require("../middlewares/authMiddleware.js");

// // 🔐 Admin Free Access Grant
// router.post(
//   "/grant",
//   protect,
//   authorize("admin", "super_admin"),
//   grantAccess
// );

// module.exports = router;
// routes/adminAccessRoute.js

const express = require("express");
const router = express.Router();

const {
  grantAccess,
  grantFinanceAccess,
  getGracePoolStatus,
} = require("../controllers/adminAccessController.js");

const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");

// Admin — unlimited
router.post("/grant", protect, authorize("admin", "super_admin"), grantAccess);

// Finance — 90 day pool
router.post("/finance-grant", protect, authorize("finance_manager"), grantFinanceAccess);

// Pool status — frontend disable logic ke liye
router.get("/pool-status/:enrollmentId", protect, authorize("finance_manager", "admin", "super_admin"), getGracePoolStatus);

module.exports = router;