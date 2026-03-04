/**
 * SignLex Backend - User Model
 * Author: Amin Memon
 *
 * MongoDB schema for user accounts. Stores Firebase UID,
 * profile data, and learning preferences.
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    photoURL: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["email", "google", "facebook"],
      default: "email",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    preferences: {
      dailyGoalMinutes: { type: Number, default: 15 },
      notificationsEnabled: { type: Boolean, default: true },
      difficultyLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner",
      },
    },
    stats: {
      totalXP: { type: Number, default: 0 },
      currentLevel: { type: Number, default: 1 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
      totalPracticeTime: { type: Number, default: 0 }, // minutes
      signsLearned: { type: Number, default: 0 },
      testsCompleted: { type: Number, default: 0 },
      bestTestScore: { type: Number, default: 0 },
    },
    streakFreezeCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for leaderboard queries
userSchema.index({ "stats.totalXP": -1 });
userSchema.index({ "stats.currentStreak": -1 });

module.exports = mongoose.model("User", userSchema);
