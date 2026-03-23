/**
 * SignLex Backend - SM-2 Spaced Repetition Tests
 * Author: Amin Memon
 *
 * Tests the SM-2 algorithm implementation including:
 * - Correct response interval progression (1 → 6 → EF-scaled)
 * - Incorrect response reset behavior
 * - Ease factor floor (minimum 1.3)
 * - Edge cases: double-zero ratings, max interval cap
 * - Rating-to-quality conversion
 * - Review prioritization by urgency
 */

const {
  calculateNextReview,
  ratingToQuality,
  prioritizeReviews,
} = require("../src/services/spacedRepetition");

describe("SM-2 calculateNextReview", () => {
  // ── Correct responses ──

  test("first correct response sets interval to 1 day", () => {
    const result = calculateNextReview(4, 0, 2.5, 1);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  test("second correct response sets interval to 6 days", () => {
    const result = calculateNextReview(4, 1, 2.5, 1);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  test("third correct response scales interval by ease factor", () => {
    const result = calculateNextReview(4, 2, 2.5, 6);
    // interval = round(6 * EF) where EF ≈ 2.5
    expect(result.interval).toBe(15); // round(6 * 2.5) = 15
    expect(result.repetitions).toBe(3);
  });

  test("perfect score (5) increases ease factor", () => {
    const result = calculateNextReview(5, 2, 2.5, 6);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  test("quality 3 (barely correct) decreases ease factor", () => {
    const result = calculateNextReview(3, 2, 2.5, 6);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  // ── Incorrect responses ──

  test("incorrect response (quality < 3) resets repetitions to 0", () => {
    const result = calculateNextReview(1, 5, 2.5, 30);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  test("quality 0 resets to interval 1 and repetitions 0", () => {
    const result = calculateNextReview(0, 10, 2.3, 60);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
  });

  // ── Ease factor edge cases ──

  test("ease factor never drops below 1.3", () => {
    // Repeatedly give low scores
    let ef = 2.5;
    let reps = 0;
    let interval = 1;

    for (let i = 0; i < 20; i++) {
      const result = calculateNextReview(0, reps, ef, interval);
      ef = result.easeFactor;
      reps = result.repetitions;
      interval = result.interval;
    }

    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  test("two consecutive zero ratings keep ease factor at floor", () => {
    const first = calculateNextReview(0, 3, 1.5, 10);
    const second = calculateNextReview(0, first.repetitions, first.easeFactor, first.interval);
    expect(second.easeFactor).toBe(1.3);
    expect(second.interval).toBe(1);
  });

  // ── Interval cap ──

  test("interval is capped at 365 days", () => {
    // With a high ease factor and long interval, result should be capped
    const result = calculateNextReview(5, 10, 3.0, 200);
    expect(result.interval).toBeLessThanOrEqual(365);
  });

  // ── Quality clamping ──

  test("quality below 0 is clamped to 0", () => {
    const result = calculateNextReview(-5, 2, 2.5, 6);
    expect(result.repetitions).toBe(0); // treated as incorrect
    expect(result.interval).toBe(1);
  });

  test("quality above 5 is clamped to 5", () => {
    const result = calculateNextReview(10, 2, 2.5, 6);
    expect(result.easeFactor).toBeGreaterThan(2.5); // perfect score behavior
  });

  // ── Full SM-2 progression ──

  test("full correct progression follows expected pattern", () => {
    let reps = 0;
    let ef = 2.5;
    let interval = 1;

    // Day 1: first correct review
    let r = calculateNextReview(4, reps, ef, interval);
    expect(r.interval).toBe(1);
    reps = r.repetitions;
    ef = r.easeFactor;
    interval = r.interval;

    // Day 2: second correct review
    r = calculateNextReview(4, reps, ef, interval);
    expect(r.interval).toBe(6);
    reps = r.repetitions;
    ef = r.easeFactor;
    interval = r.interval;

    // Day 8: third correct review
    r = calculateNextReview(4, reps, ef, interval);
    expect(r.interval).toBeGreaterThan(6); // scaled by EF
    reps = r.repetitions;
    ef = r.easeFactor;
    interval = r.interval;

    // Intervals should keep growing
    const prev = interval;
    r = calculateNextReview(4, reps, ef, interval);
    expect(r.interval).toBeGreaterThan(prev);
  });
});

describe("ratingToQuality", () => {
  test("correct + easy = 5", () => {
    expect(ratingToQuality("easy", true)).toBe(5);
  });

  test("correct + good = 4", () => {
    expect(ratingToQuality("good", true)).toBe(4);
  });

  test("correct + hard = 3", () => {
    expect(ratingToQuality("hard", true)).toBe(3);
  });

  test("incorrect + hard = 0", () => {
    expect(ratingToQuality("hard", false)).toBe(0);
  });

  test("incorrect + good = 1", () => {
    expect(ratingToQuality("good", false)).toBe(1);
  });

  test("unknown rating defaults to 3 when correct", () => {
    expect(ratingToQuality("unknown", true)).toBe(3);
  });
});

describe("prioritizeReviews", () => {
  test("sorts by urgency (overdue * difficulty)", () => {
    const now = new Date();
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000);

    const records = [
      {
        sign: "A",
        sr: { nextReviewDate: oneDayAgo, easeFactor: 2.5 },
      },
      {
        sign: "B",
        sr: { nextReviewDate: twoDaysAgo, easeFactor: 1.5 },
      },
    ];

    const result = prioritizeReviews(records);

    // B should be first: 2 days overdue * (3.0 - 1.5) = 3.0 urgency
    // A: 1 day overdue * (3.0 - 2.5) = 0.5 urgency
    expect(result[0].sign).toBe("B");
    expect(result[1].sign).toBe("A");
  });

  test("returns empty array for empty input", () => {
    expect(prioritizeReviews([])).toEqual([]);
  });

  test("cards not yet overdue have 0 overdue days", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const records = [{ sign: "X", sr: { nextReviewDate: future, easeFactor: 2.5 } }];
    const result = prioritizeReviews(records);
    expect(result[0].overdueDays).toBe(0);
  });
});
