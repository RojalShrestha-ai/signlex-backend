/**
 * SignLex Backend - Gamification Routes
 * Author: Amin Memon
 *
 * Endpoints for XP, streaks, achievements, and levels.
 *
 * Status: ~10% - Route stubs defined, controller logic TODO
 */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const gamificationController = require("../controllers/gamificationController");

// POST /api/gamification/xp - Award XP to user
router.post("/xp", requireAuth, gamificationController.awardXP);

// GET /api/gamification/streak - Get current streak info
router.get("/streak", requireAuth, gamificationController.getStreak);

// POST /api/gamification/streak/checkin - Record daily check-in
router.post("/streak/checkin", requireAuth, gamificationController.dailyCheckin);

// POST /api/gamification/streak/freeze - Use a streak freeze
router.post("/streak/freeze", requireAuth, gamificationController.useStreakFreeze);

// GET /api/gamification/achievements - Get user's achievements
router.get("/achievements", requireAuth, gamificationController.getAchievements);

// GET /api/gamification/achievements/available - Get all achievable badges
router.get("/achievements/available", requireAuth, gamificationController.getAvailableBadges);

// GET /api/gamification/level - Get level and XP info
router.get("/level", requireAuth, gamificationController.getLevelInfo);

module.exports = router;
