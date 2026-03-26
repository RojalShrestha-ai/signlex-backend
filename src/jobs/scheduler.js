/**
 * SignLex Backend - Scheduled Jobs
 * Author: Amin Memon
 *
 * Cron-like scheduled tasks for:
 * - Weekly leaderboard XP reset (every Sunday midnight)
 * - Monthly leaderboard XP reset (1st of each month)
 * - Stale streak detection and reset on server startup
 *
 * Uses setInterval for simplicity (no external cron dependency).
 * For production, consider node-cron or a dedicated job queue.
 */

const Leaderboard = require("../models/Leaderboard");
const User = require("../models/User");

/**
 * Reset weekly XP on all leaderboard entries.
 * Called every Sunday at midnight by the scheduler.
 */
async function resetWeeklyLeaderboard() {
  try {
    const result = await Leaderboard.updateMany(
      {},
      {
        $set: {
          weeklyXP: 0,
          weekStartDate: new Date(),
        },
      }
    );
    console.log(
      `[Scheduler] Weekly leaderboard reset: ${result.modifiedCount} entries`
    );
  } catch (err) {
    console.error("[Scheduler] Weekly reset failed:", err.message);
  }
}

/**
 * Reset monthly XP on all leaderboard entries.
 * Called on the 1st of each month by the scheduler.
 */
async function resetMonthlyLeaderboard() {
  try {
    const result = await Leaderboard.updateMany(
      {},
      { $set: { monthlyXP: 0 } }
    );
    console.log(
      `[Scheduler] Monthly leaderboard reset: ${result.modifiedCount} entries`
    );
  } catch (err) {
    console.error("[Scheduler] Monthly reset failed:", err.message);
  }
}

/**
 * Check for broken streaks on startup.
 * If a user's lastActiveDate is >1 day ago and they have no
 * streak freeze, reset their streak to 0.
 */
async function checkStaleStreaks() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const result = await User.updateMany(
      {
        "stats.currentStreak": { $gt: 0 },
        "stats.lastActiveDate": { $lt: yesterday },
        streakFreezeCount: { $lte: 0 },
      },
      { $set: { "stats.currentStreak": 0 } }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[Scheduler] Reset ${result.modifiedCount} stale streaks`
      );
    }
  } catch (err) {
    console.error("[Scheduler] Streak check failed:", err.message);
  }
}

/**
 * Initialize all scheduled jobs.
 * Call this once after DB connection is established.
 */
function initScheduler() {
  console.log("[Scheduler] Initializing scheduled jobs...");

  // Run stale streak check on startup
  checkStaleStreaks();

  // Check every hour if it's time to run resets
  const ONE_HOUR = 60 * 60 * 1000;
  let lastWeeklyReset = null;
  let lastMonthlyReset = null;

  setInterval(() => {
    const now = new Date();

    // Weekly reset: Sunday at midnight (hour 0)
    if (now.getDay() === 0 && now.getHours() === 0) {
      const todayStr = now.toISOString().split("T")[0];
      if (lastWeeklyReset !== todayStr) {
        lastWeeklyReset = todayStr;
        resetWeeklyLeaderboard();
      }
    }

    // Monthly reset: 1st of month at midnight
    if (now.getDate() === 1 && now.getHours() === 0) {
      const monthStr = `${now.getFullYear()}-${now.getMonth()}`;
      if (lastMonthlyReset !== monthStr) {
        lastMonthlyReset = monthStr;
        resetMonthlyLeaderboard();
      }
    }

    // Check stale streaks daily at 1 AM
    if (now.getHours() === 1) {
      checkStaleStreaks();
    }
  }, ONE_HOUR);

  console.log("[Scheduler] Jobs registered (hourly check interval)");
}

module.exports = {
  initScheduler,
  resetWeeklyLeaderboard,
  resetMonthlyLeaderboard,
  checkStaleStreaks,
};
