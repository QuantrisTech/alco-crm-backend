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
router.post("/:id/enroll-program", protect, authorize("super_admin", "admin"), enrollInProgram);
router.patch( "/:id/reject-program", protect, authorize("super_admin", "admin"), rejectProgramAccess);
router.post(
  "/:id/add-program",
  protect,
  authorize("super_admin", "admin"),
  addProgramToRequest
);

// router.put("/pin", protect, authorize("super_admin", "admin"), updatePin);
router.get("/", protect, authorize("super_admin", "admin"), getAllRequests);
router.patch("/:id/grant", protect, authorize("super_admin", "admin"), grantAccess);
router.patch("/:id/reject", protect, authorize("super_admin", "admin"), rejectAccess);

module.exports = router;