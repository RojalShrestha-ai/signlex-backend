const User = require("../models/User");
const Achievement = require("../models/Achievement");
const Leaderboard = require("../models/Leaderboard");
const { calculateLevel, xpForLevel } = require("../utils/xpCalculator");

const BADGE_DEFINITIONS = [
  { badgeId: "first_sign", badgeName: "First Sign", category: "milestone", tier: "bronze", xp: 50, criteria: "Learn your first sign" },
  { badgeId: "streak_3", badgeName: "3-Day Streak", category: "streak", tier: "bronze", xp: 100, criteria: "Maintain a 3-day practice streak" },
  { badgeId: "streak_7", badgeName: "Week Warrior", category: "streak", tier: "silver", xp: 250, criteria: "Maintain a 7-day practice streak" },
  { badgeId: "streak_30", badgeName: "Monthly Master", category: "streak", tier: "gold", xp: 1000, criteria: "Maintain a 30-day practice streak" },
  { badgeId: "accuracy_90", badgeName: "Sharp Eye", category: "accuracy", tier: "silver", xp: 200, criteria: "Achieve 90%+ accuracy on a test" },
  { badgeId: "all_signs", badgeName: "Alphabet Complete", category: "milestone", tier: "gold", xp: 500, criteria: "Learn all 26 ASL alphabet signs" },
  { badgeId: "xp_1000", badgeName: "Rising Star", category: "xp", tier: "silver", xp: 150, criteria: "Earn 1000 total XP" },
  { badgeId: "xp_5000", badgeName: "Dedicated Learner", category: "xp", tier: "gold", xp: 300, criteria: "Earn 5000 total XP" },
  { badgeId: "practice_10", badgeName: "Practice Pro", category: "practice", tier: "bronze", xp: 100, criteria: "Complete 10 practice sessions" },
  { badgeId: "test_5", badgeName: "Test Taker", category: "practice", tier: "silver", xp: 200, criteria: "Complete 5 mock tests" },
];

const awardXP = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { amount, reason } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid XP amount required" });
    }

    const previousLevel = user.stats.currentLevel;
    user.stats.totalXP += amount;
    user.stats.currentLevel = calculateLevel(user.stats.totalXP);

    const leveledUp = user.stats.currentLevel > previousLevel;
    await user.save();

    // Update leaderboard entry
    await Leaderboard.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          displayName: user.displayName,
          photoURL: user.photoURL,
          totalXP: user.stats.totalXP,
          currentStreak: user.stats.currentStreak,
        },
        $inc: { weeklyXP: amount, monthlyXP: amount },
      },
      { upsert: true }
    );

    res.json({
      xpAwarded: amount,
      reason: reason || "practice",
      totalXP: user.stats.totalXP,
      level: user.stats.currentLevel,
      leveledUp,
      nextLevelXP: xpForLevel(user.stats.currentLevel + 1),
    });
  } catch (err) {
    console.error("Award XP error:", err.message);
    res.status(500).json({ error: "Failed to award XP" });
  }
};


const getStreak = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = new Date();
    const lastActive = user.stats.lastActiveDate;
    let streakStatus = "active";

    if (lastActive) {
      const daysSince = Math.floor(
        (now - new Date(lastActive)) / (1000 * 60 * 60 * 24)
      );
      if (daysSince > 1) {
        streakStatus = "broken";
      } else if (daysSince === 0) {
        streakStatus = "completed_today";
      }
    } else {
      streakStatus = "not_started";
    }

    res.json({
      currentStreak: user.stats.currentStreak,
      longestStreak: user.stats.longestStreak,
      lastActiveDate: user.stats.lastActiveDate,
      streakFreezes: user.streakFreezeCount,
      status: streakStatus,
    });
  } catch (err) {
    console.error("Get streak error:", err.message);
    res.status(500).json({ error: "Failed to fetch streak" });
  }
};

const dailyCheckin = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActive = user.stats.lastActiveDate;

    if (lastActive) {
      const lastDate = new Date(lastActive);
      const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return res.json({
          message: "Already checked in today",
          currentStreak: user.stats.currentStreak,
        });
      } else if (diffDays === 1) {
        // Consecutive day - increment streak
        user.stats.currentStreak += 1;
      } else {
        // Streak broken - reset
        user.stats.currentStreak = 1;
      }
    } else {
      // First ever check-in
      user.stats.currentStreak = 1;
    }

    user.stats.lastActiveDate = now;

    // Update longest streak
    if (user.stats.currentStreak > user.stats.longestStreak) {
      user.stats.longestStreak = user.stats.currentStreak;
    }

    await user.save();

    res.json({
      message: "Check-in recorded",
      currentStreak: user.stats.currentStreak,
      longestStreak: user.stats.longestStreak,
    });
  } catch (err) {
    console.error("Daily checkin error:", err.message);
    res.status(500).json({ error: "Failed to record check-in" });
  }
};

/**
 * POST /api/gamification/streak/freeze
 * Use a streak freeze to protect streak from breaking.
 * TODO: Full implementation with freeze purchase/earn system.
 */
const useStreakFreeze = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.streakFreezeCount <= 0) {
      return res.status(400).json({ error: "No streak freezes available" });
    }

    user.streakFreezeCount -= 1;
    user.stats.lastActiveDate = new Date(); // Preserve streak
    await user.save();

    res.json({
      message: "Streak freeze used",
      remainingFreezes: user.streakFreezeCount,
      currentStreak: user.stats.currentStreak,
    });
  } catch (err) {
    console.error("Streak freeze error:", err.message);
    res.status(500).json({ error: "Failed to use streak freeze" });
  }
};


const getAchievements = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const achievements = await Achievement.find({ userId: user._id }).sort({
      unlockedAt: -1,
    });

    res.json({
      total: achievements.length,
      achievements,
    });
  } catch (err) {
    console.error("Get achievements error:", err.message);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
};


const getAvailableBadges = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const unlocked = await Achievement.find({ userId: user._id });
    const unlockedIds = new Set(unlocked.map((a) => a.badgeId));

    const badges = BADGE_DEFINITIONS.map((badge) => ({
      ...badge,
      unlocked: unlockedIds.has(badge.badgeId),
      unlockedAt: unlocked.find((a) => a.badgeId === badge.badgeId)?.unlockedAt || null,
    }));

    res.json({ badges });
  } catch (err) {
    console.error("Get available badges error:", err.message);
    res.status(500).json({ error: "Failed to fetch badges" });
  }
};


const getLevelInfo = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const currentLevel = user.stats.currentLevel;
    const currentLevelXP = xpForLevel(currentLevel);
    const nextLevelXP = xpForLevel(currentLevel + 1);
    const xpInLevel = user.stats.totalXP - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;

    res.json({
      level: currentLevel,
      totalXP: user.stats.totalXP,
      xpInCurrentLevel: xpInLevel,
      xpToNextLevel: xpNeeded - xpInLevel,
      progressPercent: Math.round((xpInLevel / xpNeeded) * 100),
    });
  } catch (err) {
    console.error("Get level error:", err.message);
    res.status(500).json({ error: "Failed to fetch level info" });
  }
};

module.exports = {
  awardXP,
  getStreak,
  dailyCheckin,
  useStreakFreeze,
  getAchievements,
  getAvailableBadges,
  getLevelInfo,
};
