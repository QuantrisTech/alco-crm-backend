const express = require("express");
const router = express.Router();
const verifyChatbotKey = require("../middlewares/verifyChatbotKey");
const { upsertVisitor, promoteVisitor } = require("../controllers/visitorController");

router.post("/", verifyChatbotKey, upsertVisitor);

router.post("/:id/promote", verifyChatbotKey, promoteVisitor);

module.exports = router;