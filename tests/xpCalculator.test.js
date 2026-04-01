const {
  xpForLevel,
  calculateLevel,
  calculateXPReward,
} = require("../src/utils/xpCalculator");

describe("xpForLevel", () => {
  test("level 1 requires 0 XP", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  test("level 0 and below returns 0", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-1)).toBe(0);
  });

  test("level 2 requires 100 * 2^1.5 = 282 XP", () => {
    expect(xpForLevel(2)).toBe(Math.floor(100 * Math.pow(2, 1.5)));
  });

  test("higher levels require progressively more XP", () => {
    for (let lvl = 2; lvl <= 20; lvl++) {
      expect(xpForLevel(lvl + 1)).toBeGreaterThan(xpForLevel(lvl));
    }
  });

  test("level 10 requires 3162 XP", () => {
    expect(xpForLevel(10)).toBe(Math.floor(100 * Math.pow(10, 1.5)));
  });
});

describe("calculateLevel", () => {
  test("0 XP = level 1", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  test("just below level 2 threshold stays level 1", () => {
    const threshold = xpForLevel(2);
    expect(calculateLevel(threshold - 1)).toBe(1);
  });

  test("exactly at level 2 threshold = level 2", () => {
    const threshold = xpForLevel(2);
    expect(calculateLevel(threshold)).toBe(2);
  });

  test("high XP returns high level", () => {
    expect(calculateLevel(50000)).toBeGreaterThan(10);
  });

  test("round-trip: xpForLevel(calculateLevel(xp)) <= xp", () => {
    const testXPs = [0, 50, 100, 500, 1000, 5000, 10000, 50000];
    for (const xp of testXPs) {
      const level = calculateLevel(xp);
      expect(xpForLevel(level)).toBeLessThanOrEqual(xp);
      expect(xpForLevel(level + 1)).toBeGreaterThan(xp);
    }
  });
});

describe("calculateXPReward", () => {
  test("sign_correct gives base 10 + accuracy bonus", () => {
    expect(calculateXPReward("sign_correct", { accuracy: 100 })).toBe(15);
    expect(calculateXPReward("sign_correct", { accuracy: 0 })).toBe(10);
  });

  test("sign_incorrect gives 2 XP", () => {
    expect(calculateXPReward("sign_incorrect")).toBe(2);
  });

  test("daily_checkin gives 25 XP", () => {
    expect(calculateXPReward("daily_checkin")).toBe(25);
  });

  test("sign_mastered gives 100 XP", () => {
    expect(calculateXPReward("sign_mastered")).toBe(100);
  });

  test("session_complete scales by sign count", () => {
    const xp = calculateXPReward("session_complete", {
      totalSigns: 10,
      overallAccuracy: 80,
    });
    expect(xp).toBe(10 * 5 + Math.floor(80 / 10)); // 50 + 8 = 58
  });

  test("test_complete gives more XP than session", () => {
    const testXP = calculateXPReward("test_complete", { totalSigns: 10, overallAccuracy: 80 });
    const sessionXP = calculateXPReward("session_complete", { totalSigns: 10, overallAccuracy: 80 });
    expect(testXP).toBeGreaterThan(sessionXP);
  });

  test("streak_milestone awards based on streak length", () => {
    expect(calculateXPReward("streak_milestone", { streak: 3 })).toBe(50);
    expect(calculateXPReward("streak_milestone", { streak: 7 })).toBe(100);
    expect(calculateXPReward("streak_milestone", { streak: 30 })).toBe(500);
    expect(calculateXPReward("streak_milestone", { streak: 1 })).toBe(0);
  });

  test("unknown action gives 0 XP", () => {
    expect(calculateXPReward("nonexistent_action")).toBe(0);
  });
});
