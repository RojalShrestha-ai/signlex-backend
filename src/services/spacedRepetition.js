/**
 * SignLex Backend - Spaced Repetition Service (SM-2 Algorithm)
 * Author: Amin Memon
 *
 * Implements the SM-2 spaced repetition algorithm for scheduling
 * flashcard reviews at optimal intervals.
 *
 * SM-2 Algorithm:
 *   quality: 0-5 rating of recall quality
 *     0 - Complete blackout
 *     1 - Incorrect, but recognized upon seeing answer
 *     2 - Incorrect, but answer seemed easy to recall
 *     3 - Correct with serious difficulty
 *     4 - Correct after hesitation
 *     5 - Perfect recall
 *
 *   If quality >= 3 (correct):
 *     repetitions += 1
 *     interval = 1 (first), 6 (second), previous * easeFactor (subsequent)
 *   Else (incorrect):
 *     repetitions = 0
 *     interval = 1
 *
 *   easeFactor = max(1.3, EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
 *
 * Reference: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4031794/
 */

/**
 * Calculate the next review schedule using SM-2.
 *
 * @param {number} quality - Recall quality rating (0-5)
 * @param {number} repetitions - Current repetition count
 * @param {number} easeFactor - Current ease factor (default 2.5)
 * @param {number} interval - Current interval in days
 * @returns {Object} { interval, repetitions, easeFactor }
 */
function calculateNextReview(quality, repetitions = 0, easeFactor = 2.5, interval = 1) {
  // Clamp quality to 0-5
  quality = Math.max(0, Math.min(5, Math.round(quality)));

  // Update ease factor
  let newEF =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF); // minimum ease factor

  let newInterval;
  let newReps;

  if (quality >= 3) {
    // Correct response
    newReps = repetitions + 1;

    if (newReps === 1) {
      newInterval = 1; // Review tomorrow
    } else if (newReps === 2) {
      newInterval = 6; // Review in 6 days
    } else {
      newInterval = Math.round(interval * newEF);
    }
  } else {
    // Incorrect response - reset
    newReps = 0;
    newInterval = 1; // Review tomorrow
    // Keep ease factor reduced but don't reset it completely
  }

  // Cap interval at 365 days
  newInterval = Math.min(365, newInterval);

  return {
    interval: newInterval,
    repetitions: newReps,
    easeFactor: Math.round(newEF * 100) / 100,
  };
}

/**
 * Convert a user's subjective rating to SM-2 quality score.
 * Maps from the 3-button UI (Hard/Good/Easy) to 0-5 scale.
 *
 * @param {string} rating - "hard", "good", or "easy"
 * @param {boolean} correct - whether the answer was correct
 * @returns {number} quality score 0-5
 */
function ratingToQuality(rating, correct = true) {
  if (!correct) {
    return rating === "hard" ? 0 : rating === "good" ? 1 : 2;
  }
  switch (rating) {
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
    default:
      return 3;
  }
}

/**
 * Get signs sorted by urgency of review.
 * Signs past their review date are most urgent;
 * signs with lower ease factors need more attention.
 *
 * @param {Object[]} progressRecords - array of Progress documents
 * @returns {Object[]} sorted by review priority (most urgent first)
 */
function prioritizeReviews(progressRecords) {
  const now = new Date();

  return progressRecords
    .map((p) => {
      const overdueDays = Math.max(
        0,
        (now - new Date(p.sr.nextReviewDate)) / (1000 * 60 * 60 * 24)
      );
      const urgency = overdueDays * (3.0 - p.sr.easeFactor); // lower EF = more urgent
      return { ...p, overdueDays, urgency };
    })
    .sort((a, b) => b.urgency - a.urgency);
}

module.exports = { calculateNextReview, ratingToQuality, prioritizeReviews };
