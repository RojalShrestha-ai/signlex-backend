
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
