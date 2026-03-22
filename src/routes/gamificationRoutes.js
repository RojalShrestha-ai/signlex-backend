const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const gamificationController = require("../controllers/gamificationController");

router.post("/xp", requireAuth, gamificationController.awardXP);
router.get("/streak", requireAuth, gamificationController.getStreak);
router.post("/streak/checkin", requireAuth, gamificationController.dailyCheckin);
router.post("/streak/freeze", requireAuth, gamificationController.useStreakFreeze);
router.get("/achievements", requireAuth, gamificationController.getAchievements);
router.get("/achievements/available", requireAuth, gamificationController.getAvailableBadges);
router.get("/level", requireAuth, gamificationController.getLevelInfo);

module.exports = router;
