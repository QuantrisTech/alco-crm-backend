const express = require("express");
const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteMyAccount,
  getAllUsers,
  uploadUserDocument,
  deleteUserDocument,
} = require("../controllers/userController.js");

const router = express.Router();

router.get("/", protect, authorize("admin", "super_admin", "sales_manager", "finance_manager"), getAllUsers);
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteMyAccount);

// ── Documents ────────────────────────────────────────────────
router.post("/:id/documents", protect, uploadUserDocument);
router.delete("/:id/documents/:docId", protect, deleteUserDocument);

module.exports = router;