const express = require("express");


const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");
const { getAllUsers, getUserById, updateUser, changeUserPassword, deleteUserById, deleteAllUsers, createUser, assignRole } = require("../controllers/adminController.js");

const router = express.Router();


// 🔒 Only Admin Can Access All Routes

router.get("/users", protect, authorize("admin", "super_admin"), getAllUsers);
router.get("/users/:id", protect, authorize("admin", "super_admin"), getUserById);
router.patch("/users/:id", protect, authorize("admin", "super_admin"), updateUser);
router.patch("/users/:id/change-password", protect, authorize("admin", "super_admin"), changeUserPassword);
router.delete("/users/:id", protect, authorize("admin", "super_admin"), deleteUserById);
router.delete("/users", protect, authorize("admin", "super_admin"), deleteAllUsers);
router.post("/users", protect, authorize("admin", "super_admin"), createUser);
router.patch("/users/:id/role", protect, authorize("admin", "super_admin"), assignRole);

module.exports = router;