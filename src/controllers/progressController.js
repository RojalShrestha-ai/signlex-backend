const User = require("../models/User");
const Progress = require("../models/Progress");
const Session = require("../models/Session");
const { calculateNextReview } = require("../services/spacedRepetition");

const recordAttempt = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { sign, correct, accuracy } = req.body;

    if (!sign) {
      return res.status(400).json({ error: "Sign is required" });
    }

    // Find or create progress record for this sign
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

    // Update attempt counts
    progress.totalAttempts += 1;
    if (correct) progress.correctAttempts += 1;

    // Update accuracy
    progress.accuracy =
      (progress.correctAttempts / progress.totalAttempts) * 100;

    if (accuracy > progress.bestAccuracy) {
      progress.bestAccuracy = accuracy;
    }

    // Update spaced repetition schedule
    const quality = correct ? (accuracy >= 90 ? 5 : accuracy >= 70 ? 4 : 3) : 1;
    const srUpdate = calculateNextReview(
      quality,
      progress.sr.repetitions,
      progress.sr.easeFactor,
      progress.sr.interval
    );

    progress.sr.easeFactor = srUpdate.easeFactor;
    progress.sr.interval = srUpdate.interval;
    progress.sr.repetitions = srUpdate.repetitions;
    progress.sr.nextReviewDate = new Date(
      Date.now() + srUpdate.interval * 24 * 60 * 60 * 1000
    );
    progress.sr.lastReviewDate = new Date();

    // Check mastery (>90% accuracy with 10+ attempts)
    if (progress.accuracy >= 90 && progress.totalAttempts >= 10 && !progress.mastered) {
      progress.mastered = true;
      progress.masteredAt = new Date();

      // Update user's signs learned count
      user.stats.signsLearned += 1;
      await user.save();
    }

    await progress.save();

    res.json({
      message: "Attempt recorded",
      progress: {
        sign: progress.sign,
        accuracy: progress.accuracy,
        totalAttempts: progress.totalAttempts,
        mastered: progress.mastered,
        nextReview: progress.sr.nextReviewDate,
      },
    });
  } catch (err) {
    console.error("Record attempt error:", err.message);
    res.status(500).json({ error: "Failed to record attempt" });
  }
};


const getOverview = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const allProgress = await Progress.find({ userId: user._id });

    const totalSigns = 26; // ASL alphabet
    const learned = allProgress.length;
    const mastered = allProgress.filter((p) => p.mastered).length;
    const avgAccuracy =
      allProgress.length > 0
        ? allProgress.reduce((sum, p) => sum + p.accuracy, 0) / allProgress.length
        : 0;

    res.json({
      overview: {
        totalSigns,
        learned,
        mastered,
        averageAccuracy: Math.round(avgAccuracy * 100) / 100,
        completionPercent: Math.round((learned / totalSigns) * 100),
      },
      signs: allProgress.map((p) => ({
        sign: p.sign,
        accuracy: p.accuracy,
        attempts: p.totalAttempts,
        mastered: p.mastered,
        nextReview: p.sr.nextReviewDate,
      })),
    });
  } catch (err) {
    console.error("Get overview error:", err.message);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
};


const getSignProgress = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const progress = await Progress.findOne({
      userId: user._id,
      sign: req.params.sign.toUpperCase(),
    });

    if (!progress) {
      return res.json({
        sign: req.params.sign.toUpperCase(),
        totalAttempts: 0,
        accuracy: 0,
        mastered: false,
        message: "No progress yet for this sign",
      });
    }

    res.json({ progress });
  } catch (err) {
    console.error("Get sign progress error:", err.message);
    res.status(500).json({ error: "Failed to fetch sign progress" });
  }
};

const getDueReviews = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const dueReviews = await Progress.find({
      userId: user._id,
      "sr.nextReviewDate": { $lte: new Date() },
    }).sort({ "sr.nextReviewDate": 1 });

    res.json({
      count: dueReviews.length,
      signs: dueReviews.map((p) => ({
        sign: p.sign,
        accuracy: p.accuracy,
        lastReview: p.sr.lastReviewDate,
        easeFactor: p.sr.easeFactor,
      })),
    });
  } catch (err) {
    console.error("Get due reviews error:", err.message);
    res.status(500).json({ error: "Failed to fetch due reviews" });
  }
};

const recordSession = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { sessionType, duration, signsAttempted } = req.body;

    const totalSigns = signsAttempted ? signsAttempted.length : 0;
    const correctSigns = signsAttempted
      ? signsAttempted.filter((s) => s.correct).length
      : 0;
    const overallAccuracy = totalSigns > 0 ? (correctSigns / totalSigns) * 100 : 0;

    // Calculate XP earned for this session
    const baseXP = totalSigns * 10;
    const accuracyBonus = Math.floor(overallAccuracy / 10);
    const xpEarned = baseXP + accuracyBonus;

    const session = await Session.create({
      userId: user._id,
      sessionType: sessionType || "practice",
      duration: duration || 0,
      signsAttempted: signsAttempted || [],
      totalSigns,
      correctSigns,
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      xpEarned,
    });

    user.stats.totalPracticeTime += Math.ceil((duration || 0) / 60);
    await user.save();

    res.status(201).json({
      message: "Session recorded",
      session: {
        id: session._id,
        totalSigns,
        correctSigns,
        overallAccuracy: session.overallAccuracy,
        xpEarned,
        duration,
      },
    });
  } catch (err) {
    console.error("Record session error:", err.message);
    res.status(500).json({ error: "Failed to record session" });
  }
};

const getSessionHistory = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await Session.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments({ userId: user._id });

    res.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get sessions error:", err.message);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};

module.exports = {
  recordAttempt,
  getOverview,
  getSignProgress,
  getDueReviews,
  recordSession,
  getSessionHistory,
};
