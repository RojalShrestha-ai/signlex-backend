const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sign: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    correctAttempts: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    bestAccuracy: {
      type: Number,
      default: 0,
    },
    // Spaced repetition fields (SM-2 algorithm)
    sr: {
      easeFactor: { type: Number, default: 2.5 },
      interval: { type: Number, default: 1 }, // days
      repetitions: { type: Number, default: 0 },
      nextReviewDate: { type: Date, default: Date.now },
      lastReviewDate: { type: Date, default: null },
    },
    mastered: {
      type: Boolean,
      default: false,
    },
    masteredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
progressSchema.index({ userId: 1, sign: 1 }, { unique: true });
progressSchema.index({ userId: 1, "sr.nextReviewDate": 1 });

module.exports = mongoose.model("Progress", progressSchema);
