const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const flashcardController = require("../controllers/flashcardController");

router.get("/due", requireAuth, flashcardController.getDueCards);
router.post("/review", requireAuth, flashcardController.submitReview);
router.get("/new", requireAuth, flashcardController.getNewCards);
router.get("/stats", requireAuth, flashcardController.getFlashcardStats);

module.exports = router;
