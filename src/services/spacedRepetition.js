
function calculateNextReview(quality, repetitions = 0, easeFactor = 2.5, interval = 1) {
  quality = Math.max(0, Math.min(5, Math.round(quality)));
  let newEF =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF); 

  let newInterval;
  let newReps;

  if (quality >= 3) {
    newReps = repetitions + 1;

    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
  } else {
    newReps = 0;
    newInterval = 1;
  }

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
        (now - new Date(p.sr.nextReviewDate))
      );
      const urgency = overdueDays * (3.0 - p.sr.easeFactor);
      return { ...p, overdueDays, urgency };
    })
    .sort((a, b) => b.urgency - a.urgency);
}

module.exports = { calculateNextReview, ratingToQuality, prioritizeReviews };
