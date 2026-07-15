const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const express = require("express");
const router = express.Router();
const verifyChatbotKey = require("../middlewares/verifyChatbotKey");
const { upsertVisitor, promoteVisitor, getAllVisitors, updateVisitor, checkExistingStudent, assignVisitor, unassignVisitor, reassignVisitor } = require("../controllers/visitorController");


router.post("/", verifyChatbotKey, upsertVisitor);

router.post("/:id/promote", protect, authorize("super_admin", "admin"), promoteVisitor);

router.get("/", protect, authorize("super_admin", "admin"), getAllVisitors);

router.patch("/:id", protect, authorize("super_admin", "admin"), updateVisitor);

router.get("/check-existing", verifyChatbotKey, checkExistingStudent);

router.patch("/:id/assign", protect, authorize("admin"), assignVisitor);

router.patch("/:id/unassign", protect, authorize("admin"), unassignVisitor);

router.patch("/:id/reassign", protect, authorize("super_admin"), reassignVisitor);


module.exports = router;

