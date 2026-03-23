/**
 * SignLex Backend - Flashcard Controller
 * Author: Amin Memon
 *
 * SM-2 spaced repetition flashcard system endpoints.
 * Handles fetching due cards, submitting reviews, and
 * managing the per-user review schedule.
 */

const User = require("../models/User");
const Progress = require("../models/Progress");
const {
  calculateNextReview,
  ratingToQuality,
  prioritizeReviews,
} = require("../services/spacedRepetition");

// All 26 ASL alphabet signs
const ASL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * GET /api/flashcards/due
 * Fetch all cards that are due for review, prioritized by urgency.
 * Cards with lower ease factors and higher overdue days come first.
 */
const getDueCards = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const limit = parseInt(req.query.limit) || 20;

    const dueCards = await Progress.find({
      userId: user._id,
      "sr.nextReviewDate": { $lte: new Date() },
    })
      .sort({ "sr.nextReviewDate": 1 })
      .lean();

    // Prioritize by urgency (overdue * difficulty)
    const prioritized = prioritizeReviews(dueCards).slice(0, limit);

    res.json({
      count: prioritized.length,
      totalDue: dueCards.length,
      cards: prioritized.map((c) => ({
        sign: c.sign,
        accuracy: c.accuracy,
        easeFactor: c.sr.easeFactor,
        lastReview: c.sr.lastReviewDate,
        overdueDays: Math.round(c.overdueDays * 10) / 10,
        interval: c.sr.interval,
        repetitions: c.sr.repetitions,
      })),
    });
  } catch (err) {
    console.error("Get due cards error:", err.message);
    res.status(500).json({ error: "Failed to fetch due cards" });
  }
};

/**
 * POST /api/flashcards/review
 * Submit a flashcard review result. Updates the SM-2 schedule
 * for that card based on user's self-rated recall quality.
 *
 * Body: { sign: "A", rating: "easy"|"good"|"hard", correct: true|false }
 */
const submitReview = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { sign, rating, correct } = req.body;

    if (!sign) {
      return res.status(400).json({ error: "Sign is required" });
    }
    if (!rating || !["easy", "good", "hard"].includes(rating)) {
      return res.status(400).json({ error: "Rating must be 'easy', 'good', or 'hard'" });
    }

    let progress = await Progress.findOne({
      userId: user._id,
      sign: sign.toUpperCase(),
    });

    if (!progress) {
      progress = new Progress({
        userId: user._id,
        sign: sign.toUpperCase(),
      });
    }

    // Convert rating to SM-2 quality score (0-5)
    const isCorrect = correct !== false; // default true unless explicitly false
    const quality = ratingToQuality(rating, isCorrect);

    // Run SM-2 algorithm
    const srResult = calculateNextReview(
      quality,
      progress.sr.repetitions,
      progress.sr.easeFactor,
      progress.sr.interval
    );

    // Update spaced repetition fields
    progress.sr.easeFactor = srResult.easeFactor;
    progress.sr.interval = srResult.interval;
    progress.sr.repetitions = srResult.repetitions;
    progress.sr.nextReviewDate = new Date(
      Date.now() + srResult.interval * 24 * 60 * 60 * 1000
    );
    progress.sr.lastReviewDate = new Date();

    // Update attempt counters
    progress.totalAttempts += 1;
    if (isCorrect) progress.correctAttempts += 1;
    progress.accuracy =
      (progress.correctAttempts / progress.totalAttempts) * 100;

    // Check mastery
    if (
      progress.accuracy >= 90 &&
      progress.totalAttempts >= 10 &&
      !progress.mastered
    ) {
      progress.mastered = true;
      progress.masteredAt = new Date();
      user.stats.signsLearned += 1;
      await user.save();
    }

    await progress.save();

    res.json({
      message: "Review recorded",
      sign: progress.sign,
      quality,
      result: {
        easeFactor: srResult.easeFactor,
        interval: srResult.interval,
        repetitions: srResult.repetitions,
        nextReview: progress.sr.nextReviewDate,
      },
      stats: {
        accuracy: Math.round(progress.accuracy * 100) / 100,
        totalAttempts: progress.totalAttempts,
        mastered: progress.mastered,
      },
    });
  } catch (err) {
    console.error("Submit review error:", err.message);
    res.status(500).json({ error: "Failed to submit review" });
  }
};

/**
 * GET /api/flashcards/new
 * Get signs the user hasn't started learning yet,
 * so the frontend can introduce new cards.
 */
const getNewCards = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const limit = parseInt(req.query.limit) || 5;

    const existing = await Progress.find({ userId: user._id }).select("sign");
    const learnedSigns = new Set(existing.map((p) => p.sign));
    const newSigns = ASL_ALPHABET.filter((s) => !learnedSigns.has(s));

    res.json({
      learned: learnedSigns.size,
      remaining: newSigns.length,
      nextCards: newSigns.slice(0, limit),
    });
  } catch (err) {
    console.error("Get new cards error:", err.message);
    res.status(500).json({ error: "Failed to fetch new cards" });
  }
};

/**
 * GET /api/flashcards/stats
 * Flashcard-specific stats: total reviews, accuracy trend, cards by state.
 */
const getFlashcardStats = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const allProgress = await Progress.find({ userId: user._id }).lean();

    const now = new Date();
    const dueCount = allProgress.filter(
      (p) => new Date(p.sr.nextReviewDate) <= now
    ).length;

    const mastered = allProgress.filter((p) => p.mastered).length;
    const learning = allProgress.filter((p) => !p.mastered).length;
    const notStarted = 26 - allProgress.length;

    const avgEaseFactor =
      allProgress.length > 0
        ? allProgress.reduce((s, p) => s + p.sr.easeFactor, 0) / allProgress.length
        : 2.5;

    const totalReviews = allProgress.reduce((s, p) => s + p.totalAttempts, 0);
    const totalCorrect = allProgress.reduce((s, p) => s + p.correctAttempts, 0);

    res.json({
      overview: {
        mastered,
        learning,
        notStarted,
        dueNow: dueCount,
      },
      totals: {
        totalReviews,
        totalCorrect,
        overallAccuracy:
          totalReviews > 0
            ? Math.round((totalCorrect / totalReviews) * 10000) / 100
            : 0,
        avgEaseFactor: Math.round(avgEaseFactor * 100) / 100,
      },
    });
  } catch (err) {
    console.error("Flashcard stats error:", err.message);
    res.status(500).json({ error: "Failed to fetch flashcard stats" });
  }
};

module.exports = {
  getDueCards,
  submitReview,
  getNewCards,
  getFlashcardStats,
};
