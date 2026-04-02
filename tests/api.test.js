const mockUser = {
  _id: "65a1b2c3d4e5f67890abcdef",
  firebaseUid: "test-firebase-uid-123",
  email: "amin@signlex.dev",
  displayName: "Amin Memon",
  photoURL: null,
  authProvider: "email",
  role: "user",
  preferences: { dailyGoalMinutes: 15, notificationsEnabled: true, difficultyLevel: "beginner" },
  stats: {
    totalXP: 500,
    currentLevel: 3,
    currentStreak: 5,
    longestStreak: 7,
    lastActiveDate: new Date(),
    totalPracticeTime: 120,
    signsLearned: 10,
    testsCompleted: 2,
    bestTestScore: 85,
  },
  streakFreezeCount: 2,
  isActive: true,
  toObject() { return { ...this }; },
  save: jest.fn().mockResolvedValue(true),
};

const mockProgress = {
  _id: "65b1c2d3e4f5a67890bcdef0",
  userId: mockUser._id,
  sign: "A",
  totalAttempts: 15,
  correctAttempts: 13,
  accuracy: 86.67,
  bestAccuracy: 95,
  mastered: false,
  sr: { easeFactor: 2.5, interval: 6, repetitions: 3, nextReviewDate: new Date(Date.now() - 86400000), lastReviewDate: new Date() },
  save: jest.fn().mockResolvedValue(true),
};

jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue({ connection: { host: "mocked" } }),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
      readyState: 1,
    },
  };
});

jest.mock("../src/models/User", () => {
  const mock = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
  };
  return mock;
});

jest.mock("../src/models/Progress", () => {
  const mock = {
    find: jest.fn(),
    findOne: jest.fn(),
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  };
  return mock;
});

jest.mock("../src/models/Session", () => {
  const mock = {
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    findOne: jest.fn(),
  };
  return mock;
});

jest.mock("../src/models/Achievement", () => {
  const mock = {
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };
  return mock;
});

jest.mock("../src/models/Leaderboard", () => {
  const mock = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  };
  return mock;
});


jest.mock("../src/config/firebase", () => ({
  initializeFirebase: jest.fn(),
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: "test-firebase-uid-123",
      email: "amin@signlex.dev",
      name: "Amin Memon",
      picture: null,
    }),
  })),
}));

jest.mock("../src/config/db", () => jest.fn().mockResolvedValue(true));

jest.mock("../src/jobs/scheduler", () => ({
  initScheduler: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/server");
const User = require("../src/models/User");
const Progress = require("../src/models/Progress");
const Session = require("../src/models/Session");
const Achievement = require("../src/models/Achievement");
const Leaderboard = require("../src/models/Leaderboard");

const AUTH_HEADER = { Authorization: "Bearer fake-valid-token" };

beforeEach(() => {
  jest.clearAllMocks();

  User.findOne.mockResolvedValue({ ...mockUser, save: jest.fn().mockResolvedValue(true), toObject: mockUser.toObject });
  User.findById.mockResolvedValue(mockUser);
  User.create.mockResolvedValue(mockUser);

  Progress.find.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockProgress]),
    }),
    select: jest.fn().mockResolvedValue([{ sign: "A" }]),
    lean: jest.fn().mockResolvedValue([mockProgress]),
  });

  Progress.find.mockImplementation(() => {
    const chainable = {
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockProgress]),
      }),
      select: jest.fn().mockResolvedValue([{ sign: "A" }]),
      lean: jest.fn().mockResolvedValue([mockProgress]),
      then: (resolve) => resolve([mockProgress]),
    };
    chainable[Symbol.toStringTag] = "Promise";
    return chainable;
  });
  Progress.findOne.mockResolvedValue(mockProgress);
  Progress.aggregate.mockResolvedValue([]);

  Session.find.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    }),
  });
  Session.countDocuments.mockResolvedValue(0);
  Session.aggregate.mockResolvedValue([]);
  Session.create.mockResolvedValue({ _id: "sess123", totalSigns: 5, correctSigns: 4, overallAccuracy: 80, xpEarned: 58 });

  Achievement.find.mockReturnValue({
    sort: jest.fn().mockResolvedValue([]),
  });
  Achievement.find.mockImplementation(() => {
    const chainable = {
      sort: jest.fn().mockResolvedValue([]),
      then: (resolve) => resolve([]),
    };
    return chainable;
  });

  Leaderboard.find.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      }),
    }),
  });
  Leaderboard.findOne.mockResolvedValue(null);
  Leaderboard.findOneAndUpdate.mockResolvedValue({});
  Leaderboard.countDocuments.mockResolvedValue(0);
});

describe("Health Check", () => {
  test("GET /api/health returns 200 with service info", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("signlex-backend");
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("404 Handler", () => {
  test("Unknown route returns 404", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Route not found");
  });
});

describe("Auth Middleware", () => {
  test("Request without token returns 401", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No authentication token/);
  });

  test("Request with malformed header returns 401", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "NotBearer token");
    expect(res.status).toBe(401);
  });
});

describe("User Routes", () => {
  test("GET /api/users/me returns user profile", async () => {
    const res = await request(app).get("/api/users/me").set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("amin@signlex.dev");
  });

  test("GET /api/users/me/stats returns stats", async () => {
    User.findOne.mockResolvedValue({ stats: mockUser.stats, streakFreezeCount: 2 });
    const res = await request(app).get("/api/users/me/stats").set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.totalXP).toBe(500);
  });
});

describe("Gamification Routes", () => {
  test("GET /api/gamification/streak returns streak info", async () => {
    const res = await request(app).get("/api/gamification/streak").set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.currentStreak).toBe(5);
    expect(res.body.status).toBeDefined();
  });

  test("GET /api/gamification/level returns level info", async () => {
    const res = await request(app).get("/api/gamification/level").set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.level).toBeDefined();
    expect(res.body.totalXP).toBeDefined();
    expect(res.body.progressPercent).toBeDefined();
  });

  test("GET /api/gamification/achievements/available returns badge list", async () => {
    const res = await request(app).get("/api/gamification/achievements/available").set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.badges).toBeDefined();
    expect(res.body.badges.length).toBe(10); // 10 badge definitions
  });

  test("POST /api/gamification/xp requires amount", async () => {
    const res = await request(app)
      .post("/api/gamification/xp")
      .set(AUTH_HEADER)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/XP amount/);
  });
});

describe("Leaderboard Routes", () => {
  test("GET /api/leaderboard/global is publicly accessible", async () => {
    const res = await request(app).get("/api/leaderboard/global");
    expect(res.status).toBe(200);
    expect(res.body.period).toBe("all-time");
    expect(res.body.rankings).toBeDefined();
  });

  test("GET /api/leaderboard/weekly returns weekly rankings", async () => {
    const res = await request(app).get("/api/leaderboard/weekly");
    expect(res.status).toBe(200);
    expect(res.body.period).toBe("weekly");
  });

  test("GET /api/leaderboard/me requires auth", async () => {
    const res = await request(app).get("/api/leaderboard/me");
    expect(res.status).toBe(401);
  });
});

describe("Flashcard Routes", () => {
  test("GET /api/flashcards/new returns unlearned signs", async () => {
    const res = await request(app).get("/api/flashcards/new").set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.learned).toBeDefined();
    expect(res.body.remaining).toBeDefined();
    expect(res.body.nextCards).toBeDefined();
  });

  test("POST /api/flashcards/review validates rating", async () => {
    const res = await request(app)
      .post("/api/flashcards/review")
      .set(AUTH_HEADER)
      .send({ sign: "A", rating: "invalid_rating" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Rating/);
  });

  test("POST /api/flashcards/review requires sign", async () => {
    const res = await request(app)
      .post("/api/flashcards/review")
      .set(AUTH_HEADER)
      .send({ rating: "good" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Sign/);
  });
});

describe("Progress Routes", () => {
  test("POST /api/progress/record requires sign", async () => {
    const res = await request(app)
      .post("/api/progress/record")
      .set(AUTH_HEADER)
      .send({ correct: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Sign/i);
  });

  test("GET /api/progress/sessions returns paginated history", async () => {
    const res = await request(app)
      .get("/api/progress/sessions?page=1&limit=5")
      .set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.sessions).toBeDefined();
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
  });
});

describe("Analytics Routes", () => {
  test("GET /api/analytics/weekly-summary returns aggregated data", async () => {
    const res = await request(app).get("/api/analytics/weekly-summary").set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.period).toBeDefined();
    expect(res.body.summary).toBeDefined();
    expect(res.body.dailyBreakdown).toBeDefined();
  });

  test("GET /api/analytics/learning-trend accepts days param", async () => {
    const res = await request(app)
      .get("/api/analytics/learning-trend?days=14")
      .set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.period.days).toBe(14);
  });
});

describe("User not found handling", () => {
  test("returns 404 when user doesn't exist", async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).get("/api/users/me").set(AUTH_HEADER);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
