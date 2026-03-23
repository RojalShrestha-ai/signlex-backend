const mongoose = require("mongoose");
const User = require("../models/User");
const Session = require("../models/Session");
const Progress = require("../models/Progress");

const getWeeklySummary = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyBreakdown = await Session.aggregate([
      {
        $match: {
          userId: user._id,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalSigns: { $sum: "$totalSigns" },
          correctSigns: { $sum: "$correctSigns" },
          averageAccuracy: { $avg: "$overallAccuracy" },
          xpEarned: { $sum: "$xpEarned" },
          sessionsCount: { $sum: 1 },
          totalDuration: { $sum: "$duration" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Compute overall week totals
    const weekTotals = dailyBreakdown.reduce(
      (acc, day) => {
        acc.totalSigns += day.totalSigns;
        acc.correctSigns += day.correctSigns;
        acc.totalXP += day.xpEarned;
        acc.totalSessions += day.sessionsCount;
        acc.totalDuration += day.totalDuration;
        return acc;
      },
      { totalSigns: 0, correctSigns: 0, totalXP: 0, totalSessions: 0, totalDuration: 0 }
    );

    const weekAvgAccuracy =
      weekTotals.totalSigns > 0
        ? Math.round((weekTotals.correctSigns / weekTotals.totalSigns) * 10000) / 100
        : 0;

    res.json({
      period: {
        from: sevenDaysAgo.toISOString().split("T")[0],
        to: new Date().toISOString().split("T")[0],
      },
      summary: {
        ...weekTotals,
        averageAccuracy: weekAvgAccuracy,
        activeDays: dailyBreakdown.length,
      },
      dailyBreakdown: dailyBreakdown.map((d) => ({
        date: d._id,
        signsReviewed: d.totalSigns,
        correctSigns: d.correctSigns,
        accuracy: Math.round(d.averageAccuracy * 100) / 100,
        xpEarned: d.xpEarned,
        sessions: d.sessionsCount,
        durationSeconds: d.totalDuration,
      })),
    });
  } catch (err) {
    console.error("Weekly summary error:", err.message);
    res.status(500).json({ error: "Failed to generate weekly summary" });
  }
};

/**
 * GET /api/analytics/sign-breakdown
 * Per-sign accuracy and attempt stats - useful for identifying weak signs.
 */
const getSignBreakdown = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const breakdown = await Progress.aggregate([
      { $match: { userId: user._id } },
      {
        $project: {
          sign: 1,
          accuracy: 1,
          totalAttempts: 1,
          correctAttempts: 1,
          mastered: 1,
          easeFactor: "$sr.easeFactor",
          nextReview: "$sr.nextReviewDate",
          interval: "$sr.interval",
        },
      },
      { $sort: { accuracy: 1 } }, // weakest signs first
    ]);

    const mastered = breakdown.filter((s) => s.mastered).length;
    const inProgress = breakdown.filter((s) => !s.mastered && s.totalAttempts > 0).length;

    res.json({
      totalSignsAttempted: breakdown.length,
      mastered,
      inProgress,
      notStarted: 26 - breakdown.length,
      signs: breakdown,
    });
  } catch (err) {
    console.error("Sign breakdown error:", err.message);
    res.status(500).json({ error: "Failed to generate sign breakdown" });
  }
};

/**
 * GET /api/analytics/learning-trend
 * Monthly learning trend - sessions and accuracy over the past 30 days.
 */
const getLearningTrend = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const trend = await Session.aggregate([
      {
        $match: {
          userId: user._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          signsReviewed: { $sum: "$totalSigns" },
          avgAccuracy: { $avg: "$overallAccuracy" },
          xpEarned: { $sum: "$xpEarned" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      period: { days, from: startDate.toISOString().split("T")[0] },
      trend,
    });
  } catch (err) {
    console.error("Learning trend error:", err.message);
    res.status(500).json({ error: "Failed to generate learning trend" });
  }
};

module.exports = {
  getWeeklySummary,
  getSignBreakdown,
  getLearningTrend,
};
