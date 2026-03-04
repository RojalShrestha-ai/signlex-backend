/**
 * SignLex Backend - Progress Routes
 * Author: Amin Memon
 *
 * Endpoints for tracking and retrieving learning progress.
 */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const progressController = require("../controllers/progressController");

// POST /api/progress/record - Record a practice attempt for a sign
router.post("/record", requireAuth, progressController.recordAttempt);

// GET /api/progress/overview - Get overall progress summary
router.get("/overview", requireAuth, progressController.getOverview);

// GET /api/progress/sign/:sign - Get progress for a specific sign
router.get("/sign/:sign", requireAuth, progressController.getSignProgress);

// GET /api/progress/due-reviews - Get signs due for spaced repetition review
router.get("/due-reviews", requireAuth, progressController.getDueReviews);

// POST /api/progress/session - Record a complete practice session
router.post("/session", requireAuth, progressController.recordSession);

// GET /api/progress/sessions - Get session history
router.get("/sessions", requireAuth, progressController.getSessionHistory);

module.exports = router;
