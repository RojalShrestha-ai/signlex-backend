const Achievement = require("../models/Achievement");
const User = require("../models/User");
const Progress = require("../models/Progress");
const Session = require("../models/Session");
const { calculateXPReward } = require("../utils/xpCalculator");

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

async function checkAndUnlockAchievements(userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  const existing = await Achievement.find({ userId });
  const unlockedIds = new Set(existing.map((a) => a.badgeId));

  const newlyUnlocked = [];

  const progressRecords = await Progress.find({ userId });
  const sessionCount = await Session.countDocuments({ userId });
  const testCount = await Session.countDocuments({
    userId,
    sessionType: "mock_test",
  });
  const signsLearned = progressRecords.length;
  const masteredCount = progressRecords.filter((p) => p.mastered).length;

  for (const badge of BADGE_DEFINITIONS) {
    if (unlockedIds.has(badge.badgeId)) continue; // already have it

    let earned = false;

    switch (badge.badgeId) {
      case "first_sign":
        earned = signsLearned >= 1;
        break;
      case "streak_3":
        earned = user.stats.currentStreak >= 3;
        break;
      case "streak_7":
        earned = user.stats.currentStreak >= 7;
        break;
      case "streak_30":
        earned = user.stats.currentStreak >= 30;
        break;
      case "accuracy_90":
        const highAccuracyTest = await Session.findOne({
          userId,
          sessionType: "mock_test",
          overallAccuracy: { $gte: 90 },
        });
        earned = !!highAccuracyTest;
        break;
      case "all_signs":
        earned = signsLearned >= 26;
        break;
      case "xp_1000":
        earned = user.stats.totalXP >= 1000;
        break;
      case "xp_5000":
        earned = user.stats.totalXP >= 5000;
        break;
      case "practice_10":
        earned = sessionCount >= 10;
        break;
      case "test_5":
        earned = testCount >= 5;
        break;
    }

    if (earned) {
      try {
        const achievement = await Achievement.create({
          userId,
          badgeId: badge.badgeId,
          badgeName: badge.badgeName,
          description: badge.criteria,
          category: badge.category,
          tier: badge.tier,
          xpAwarded: badge.xp,
        });

        user.stats.totalXP += badge.xp;
        newlyUnlocked.push({
          badgeId: badge.badgeId,
          badgeName: badge.badgeName,
          tier: badge.tier,
          xpAwarded: badge.xp,
        });
      } catch (err) {
        if (err.code !== 11000) {
          console.error(`Failed to unlock badge ${badge.badgeId}:`, err.message);
        }
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    await user.save();
  }

  return newlyUnlocked;
}

module.exports = { checkAndUnlockAchievements, BADGE_DEFINITIONS };
