// routes/enrollmentRoutes.js
const express = require("express");
const router = express.Router();

const {
  createEnrollment,
  createEnrollmentDirect,
  createEnrollmentDirectBundle,
  getMyEnrollments,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  graduateEnrollment,
  suspendEnrollment,
  reactivateEnrollment,
  assignEnrollment,
  previewBulkEnrollment,
  bulkConfirmEnrollment
} = require("../controllers/enrollmentController");

const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { uploadExcel } = require("../middlewares/uploadExcel.js");


// STUDENT
router.get("/my", protect, getMyEnrollments);

// ADMIN
router.post("/", protect, authorize("admin", "super_admin" , "finance_manager"), createEnrollment);

router.post("/direct", protect, authorize("admin", "super_admin", "sales_manager", "finance_manager"), createEnrollmentDirect);

router.post("/direct/bundle", protect, authorize("admin", "super_admin", "sales_manager", "finance_manager"), createEnrollmentDirectBundle);

router.get("/", protect, authorize("admin", "super_admin", "sales_rep", "sales_manager", "finance_manager"), getAllEnrollments);

router.get("/:id", protect, getEnrollmentById);

router.put("/:id", protect, authorize("admin", "super_admin", "sales_manager", "finance_manager"), updateEnrollment);

router.delete("/:id", protect, authorize("admin", "super_admin", "finance_manager"), deleteEnrollment);

router.post("/:id/graduate", protect, authorize("admin", "super_admin" , "finance_manager"), graduateEnrollment);

router.post("/:id/suspend", protect, authorize("admin", "super_admin" , "finance_manager"), suspendEnrollment);

router.post("/:id/reactivate", protect, authorize("admin", "super_admin" , "finance_manager"), reactivateEnrollment);

router.patch("/:id/assign", protect, authorize("admin", "super_admin", "sales_manager", "finance_manager"), assignEnrollment);

router.post(
  "/bulk-import/preview",
  protect,
  authorize("admin", "super_admin", "sales_manager", "finance_manager"),
  uploadExcel.single("file"),
  previewBulkEnrollment
);

router.post(
  "/bulk-import/confirm",
  protect,
  authorize("admin", "super_admin", "sales_manager", "finance_manager"),
  bulkConfirmEnrollment
);

module.exports = router;