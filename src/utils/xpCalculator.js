/**
 * SignLex Backend - XP & Level Calculator
 * Author: Amin Memon
 *
 * Calculates user levels based on total XP using a progressive
 * curve. Each level requires more XP than the last.
 *
 * Level curve: XP = 100 * level^1.5
 *   Level 1:   0 XP
 *   Level 2:   100 XP
 *   Level 3:   283 XP
 *   Level 5:   1,118 XP
 *   Level 10:  3,162 XP
 *   Level 20:  8,944 XP
 *   Level 50:  35,355 XP
 */

/**
 * Calculate the total XP required to reach a given level.
 * @param {number} level
 * @returns {number} XP threshold for this level
 */
function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Calculate what level a user is at given their total XP.
 * @param {number} totalXP
 * @returns {number} current level (1+)
 */
function calculateLevel(totalXP) {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
}

/**
 * Calculate XP reward for various actions.
 * @param {string} action - type of action performed
 * @param {Object} data - action-specific data
 * @returns {number} XP to award
 */
function calculateXPReward(action, data = {}) {
  switch (action) {
    case "sign_correct":
      // Base 10 XP + accuracy bonus
      return 10 + Math.floor((data.accuracy || 0) / 20);

    case "sign_incorrect":
      // Small XP for trying
      return 2;

    case "session_complete":
      // 5 XP per sign attempted + accuracy bonus
      const baseXP = (data.totalSigns || 0) * 5;
      const accuracyBonus = Math.floor((data.overallAccuracy || 0) / 10);
      return baseXP + accuracyBonus;

    case "test_complete":
      // 20 XP per sign + big accuracy bonus
      const testBase = (data.totalSigns || 0) * 20;
      const testBonus = Math.floor((data.overallAccuracy || 0) / 5);
      return testBase + testBonus;

    case "daily_checkin":
      return 25;

    case "streak_milestone":
      // Bonus XP for streak milestones
      const streak = data.streak || 0;
      if (streak >= 30) return 500;
      if (streak >= 7) return 100;
      if (streak >= 3) return 50;
      return 0;

    case "sign_mastered":
      return 100;

    default:
      return 0;
  }
}

module.exports = { xpForLevel, calculateLevel, calculateXPReward };
