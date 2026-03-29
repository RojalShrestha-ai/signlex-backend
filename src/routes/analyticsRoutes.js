const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const analyticsController = require("../controllers/analyticsController");

router.get("/weekly-summary", requireAuth, analyticsController.getWeeklySummary);
router.get("/sign-breakdown", requireAuth, analyticsController.getSignBreakdown);
router.get("/learning-trend", requireAuth, analyticsController.getLearningTrend);

module.exports = router;
