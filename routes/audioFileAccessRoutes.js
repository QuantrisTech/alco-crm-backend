const express = require("express");
const router = express.Router();
const {
  // verifyPin,
  // updatePin,
  enrollInProgram,
  rejectProgramAccess,
  addProgramToRequest,
  getAllRequests,
  requestAccess,
  grantAccess,
  rejectAccess,
} = require("../controllers/audioFileAccessController.js");
const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");

// ⚠️ route order: exact paths before /:id
// router.post("/verify-pin", verifyPin);
router.post("/request", requestAccess);
router.post("/:id/enroll-program", protect, authorize("super_admin", "admin", "sales_manager"), enrollInProgram);
router.patch( "/:id/reject-program", protect, authorize("super_admin", "admin", "sales_manager"), rejectProgramAccess);
router.post(
  "/:id/add-program",
  protect,
  authorize("super_admin", "admin", "sales_manager"),
  addProgramToRequest
);

// router.put("/pin", protect, authorize("super_admin", "admin", "sales_manager"), updatePin);
router.get("/", protect, authorize("super_admin", "admin", "sales_manager"), getAllRequests);
router.patch("/:id/grant", protect, authorize("super_admin", "admin", "sales_manager"), grantAccess);
router.patch("/:id/reject", protect, authorize("super_admin", "admin", "sales_manager"), rejectAccess);

module.exports = router;