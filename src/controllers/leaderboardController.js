/**
 * SignLex Backend - Leaderboard Controller
 * Author: Amin Memon
 *
 * Handles leaderboard ranking queries: global (all-time),
 * weekly, monthly, and individual rank lookup.
 *
 * Status: ~10% - Basic queries defined, aggregation pipelines TODO
 */

const Leaderboard = require("../models/Leaderboard");
const User = require("../models/User");

const DEFAULT_LIMIT = 20;

/**
 * GET /api/leaderboard/global
 * All-time top rankings by total XP.
 */
const getGlobalRankings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;

    const rankings = await Leaderboard.find()
      .sort({ totalXP: -1 })
      .limit(limit)
      .select("displayName photoURL totalXP currentStreak");

    const ranked = rankings.map((entry, index) => ({
      rank: index + 1,
      displayName: entry.displayName,
      photoURL: entry.photoURL,
      totalXP: entry.totalXP,
      currentStreak: entry.currentStreak,
    }));

    res.json({ period: "all-time", rankings: ranked });
  } catch (err) {
    console.error("Global rankings error:", err.message);
    res.status(500).json({ error: "Failed to fetch rankings" });
  }
};

/**
 * GET /api/leaderboard/weekly
 * This week's rankings by weekly XP.
 */
const getWeeklyRankings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;

    const rankings = await Leaderboard.find({ weeklyXP: { $gt: 0 } })
      .sort({ weeklyXP: -1 })
      .limit(limit)
      .select("displayName photoURL weeklyXP currentStreak");

    const ranked = rankings.map((entry, index) => ({
      rank: index + 1,
      displayName: entry.displayName,
      photoURL: entry.photoURL,
      weeklyXP: entry.weeklyXP,
      currentStreak: entry.currentStreak,
    }));

    res.json({ period: "weekly", rankings: ranked });
  } catch (err) {
    console.error("Weekly rankings error:", err.message);
    res.status(500).json({ error: "Failed to fetch rankings" });
  }
};

/**
 * GET /api/leaderboard/monthly
 * This month's rankings by monthly XP.
 */
const getMonthlyRankings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;

    const rankings = await Leaderboard.find({ monthlyXP: { $gt: 0 } })
      .sort({ monthlyXP: -1 })
      .limit(limit)
      .select("displayName photoURL monthlyXP currentStreak");

    const ranked = rankings.map((entry, index) => ({
      rank: index + 1,
      displayName: entry.displayName,
      photoURL: entry.photoURL,
      monthlyXP: entry.monthlyXP,
      currentStreak: entry.currentStreak,
    }));

    res.json({ period: "monthly", rankings: ranked });
  } catch (err) {
    console.error("Monthly rankings error:", err.message);
    res.status(500).json({ error: "Failed to fetch rankings" });
  }
};

/**
 * GET /api/leaderboard/me
 * Get the authenticated user's rank.
 */
const getMyRank = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const myEntry = await Leaderboard.findOne({ userId: user._id });
    if (!myEntry) {
      return res.json({ rank: null, message: "Not yet ranked. Start learning!" });
    }

    // Count how many users have more XP
    const usersAbove = await Leaderboard.countDocuments({
      totalXP: { $gt: myEntry.totalXP },
    });

    res.json({
      rank: usersAbove + 1,
      totalXP: myEntry.totalXP,
      weeklyXP: myEntry.weeklyXP,
      monthlyXP: myEntry.monthlyXP,
    });
  } catch (err) {
    console.error("Get my rank error:", err.message);
    res.status(500).json({ error: "Failed to fetch rank" });
  }
};

module.exports = {
  getGlobalRankings,
  getWeeklyRankings,
  getMonthlyRankings,
  getMyRank,
};
