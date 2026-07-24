const express = require("express");


const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/roleMiddleware.js");
const { bulkImportUsers, bulkImportOldUsers, getAllUsers, getAllAssignRole, getUserById, updateUser, changeUserPassword, deleteUserById, deleteAllUsers, createUser, assignRole, getAdminRecipients } = require("../controllers/adminController.js");
const { uploadExcel } = require("../middlewares/uploadExcel.js");

const router = express.Router();


// 🔒 Only Admin Can Access All Routes

router.get("/users", protect, authorize("admin", "super_admin", "sales_manager", "finance_manager", "email_marketing"), getAllUsers);
router.get("/assign-role-users", protect, authorize("admin", "super_admin", "sales_manager", "sales_rep", "finance_manager", "email_marketing"), getAllAssignRole);
router.get("/users/recipients", protect, authorize("admin", "super_admin", "finance_manager"), getAdminRecipients);
router.get("/users/:id", protect, authorize("admin", "super_admin"), getUserById);
router.patch("/users/:id", protect, authorize("admin", "super_admin", "finance_manager"), updateUser);
router.patch("/users/:id/change-password", protect, authorize("admin", "super_admin"), changeUserPassword);
router.delete("/users/:id", protect, authorize("admin", "super_admin"), deleteUserById);
router.delete("/users", protect, authorize("admin", "super_admin"), deleteAllUsers);
router.post("/users", protect, authorize("admin", "super_admin"), createUser);
router.patch("/users/:id/role", protect, authorize("admin", "super_admin", "sales_manager"), assignRole);

// Agar aapko sirf ek button chahiye jahan admin Excel upload kare (name/email/phone) → bulkImportUsers hi kaafi hai 

router.post(
  "/users/import",
  protect,
  authorize("admin", "super_admin", "finance_manager"),
  uploadExcel.single("file"),
  bulkImportUsers
);

// Agar kabhi aapko raw JSON (jaise migration script ya Postman se) bhi import karna ho, jisme fields already defined hon → bulkImportOldUsers wahan kaam aayega

// router.post(
//   "/users/import-old-users",
//   protect,
//   authorize("admin", "super_admin", "finance_manager"),
//   bulkImportOldUsers
// );


module.exports = router;