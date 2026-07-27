const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const express = require("express");
const router = express.Router();
const verifyChatbotKey = require("../middlewares/verifyChatbotKey");
const { upsertVisitor, promoteVisitor, getAllVisitors, updateVisitor } = require("../controllers/visitorController");

router.post("/", verifyChatbotKey, upsertVisitor);

router.post("/:id/promote", protect, authorize("super_admin", "admin"), promoteVisitor);

router.get("/", protect, authorize("super_admin", "admin"), getAllVisitors);

router.patch("/:id", protect, authorize("super_admin", "admin"), updateVisitor);

module.exports = router;

