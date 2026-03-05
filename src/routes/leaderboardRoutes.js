const express = require("express");
const router = express.Router();
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const leaderboardController = require("../controllers/leaderboardController");

router.get("/global", optionalAuth, leaderboardController.getGlobalRankings);
router.get("/weekly", optionalAuth, leaderboardController.getWeeklyRankings);
router.get("/monthly", optionalAuth, leaderboardController.getMonthlyRankings);
router.get("/me", requireAuth, leaderboardController.getMyRank);

module.exports = router;
