const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const gamificationController = require("../controllers/gamificationController");

// Award XP to user
router.post("/xp", requireAuth, gamificationController.awardXP);
// Get current streak info
router.get("/streak", requireAuth, gamificationController.getStreak);
// Record daily check-in
router.post("/streak/checkin", requireAuth, gamificationController.dailyCheckin);
// Use a streak freeze
router.post("/streak/freeze", requireAuth, gamificationController.useStreakFreeze);
// Get user's achievements
router.get("/achievements", requireAuth, gamificationController.getAchievements);
// Get all achievable badges
router.get("/achievements/available", requireAuth, gamificationController.getAvailableBadges);
// Get level and XP info
router.get("/level", requireAuth, gamificationController.getLevelInfo);

module.exports = router;
