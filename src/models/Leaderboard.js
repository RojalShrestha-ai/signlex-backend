/**
 * SignLex Backend - Leaderboard Model
 * Author: Amin Memon
 *
 * Stores weekly/all-time leaderboard snapshots.
 * Updated whenever user XP changes via the gamification controller.
 */

const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    photoURL: {
      type: String,
      default: null,
    },
    totalXP: {
      type: Number,
      default: 0,
    },
    weeklyXP: {
      type: Number,
      default: 0,
    },
    monthlyXP: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: null,
    },
    weekStartDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for ranking queries
leaderboardSchema.index({ totalXP: -1 });
leaderboardSchema.index({ weeklyXP: -1 });
leaderboardSchema.index({ monthlyXP: -1 });
leaderboardSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
