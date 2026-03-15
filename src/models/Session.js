const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionType: {
      type: String,
      enum: ["practice", "flashcard", "drill", "mock_test"],
      required: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    signsAttempted: [
      {
        sign: { type: String, uppercase: true },
        correct: { type: Boolean },
        accuracy: { type: Number, min: 0, max: 100 },
        timeSpent: { type: Number },
      },
    ],
    totalSigns: {
      type: Number,
      default: 0,
    },
    correctSigns: {
      type: Number,
      default: 0,
    },
    overallAccuracy: {
      type: Number,
      default: 0,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Session", sessionSchema);
