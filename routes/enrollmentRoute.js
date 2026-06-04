// routes/enrollmentRoutes.js
const express = require("express");
const router = express.Router();

const {
  createEnrollment,
  getMyEnrollments,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  graduateEnrollment,
  suspendEnrollment,
  reactivateEnrollment,
  assignEnrollment,
} = require("../controllers/enrollmentController");

const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

// STUDENT
router.get("/my", protect, getMyEnrollments);

// ADMIN
router.post("/", protect, authorize("admin", "super_admin"), createEnrollment);

router.get("/", protect, authorize("admin", "super_admin", "sales_rep", "sales_manager", "finance_manager"), getAllEnrollments);

router.get("/:id", protect, getEnrollmentById);

router.put("/:id", protect, authorize("admin", "super_admin"), updateEnrollment);

router.delete("/:id", protect, authorize("admin", "super_admin"), deleteEnrollment);

router.post("/:id/graduate", protect, authorize("admin", "super_admin"), graduateEnrollment);

router.post("/:id/suspend", protect, authorize("admin", "super_admin"), suspendEnrollment);

router.post("/:id/reactivate", protect, authorize("admin", "super_admin"), reactivateEnrollment);

router.patch("/:id/assign", protect, assignEnrollment);

module.exports = router;