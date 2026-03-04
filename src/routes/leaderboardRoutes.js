/**
 * SignLex Backend - Leaderboard Routes
 * Author: Amin Memon
 *
 * Endpoints for global and time-filtered leaderboard rankings.
 *
 * Status: ~10% - Route stubs defined, controller logic TODO
 */

const express = require("express");
const router = express.Router();
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const leaderboardController = require("../controllers/leaderboardController");

// GET /api/leaderboard/global - Get all-time top rankings
router.get("/global", optionalAuth, leaderboardController.getGlobalRankings);

// GET /api/leaderboard/weekly - Get this week's rankings
router.get("/weekly", optionalAuth, leaderboardController.getWeeklyRankings);

// GET /api/leaderboard/monthly - Get this month's rankings
router.get("/monthly", optionalAuth, leaderboardController.getMonthlyRankings);

// GET /api/leaderboard/me - Get current user's rank
router.get("/me", requireAuth, leaderboardController.getMyRank);

module.exports = router;
