# SignLex Backend - Node.js/Express API Server

## Author: Amin Memon (Backend Lead / Systems Architect)

## Overview
RESTful API server for SignLex built with Node.js, Express, and MongoDB.
Handles user authentication (Firebase), progress tracking, SM-2 spaced repetition
flashcards, gamification (XP, levels, streaks, achievements), leaderboards,
and analytics dashboards.

## Project Structure
```
signlex-backend/
├── src/
│   ├── server.js                    # Express app entry point
│   ├── config/
│   │   ├── db.js                    # MongoDB connection with retry
│   │   └── firebase.js              # Firebase Admin SDK init
│   ├── models/
│   │   ├── User.js                  # User schema (profile, stats, preferences)
│   │   ├── Progress.js              # Per-sign learning progress + SR fields
│   │   ├── Achievement.js           # Badge/achievement unlock records
│   │   ├── Leaderboard.js           # Leaderboard entries (global/weekly/monthly)
│   │   └── Session.js               # Practice session history
│   ├── middleware/
│   │   └── authMiddleware.js        # Firebase token verification
│   ├── routes/
│   │   ├── userRoutes.js            # User CRUD
│   │   ├── progressRoutes.js        # Progress tracking & session recording
│   │   ├── gamificationRoutes.js    # XP, streaks, achievements, levels
│   │   ├── leaderboardRoutes.js     # Global/weekly/monthly rankings
│   │   ├── flashcardRoutes.js       # SM-2 flashcard review system
│   │   └── analyticsRoutes.js       # Weekly summaries & learning trends
│   ├── controllers/
│   │   ├── userController.js        # Registration, profile, stats
│   │   ├── progressController.js    # Attempt recording, session history
│   │   ├── gamificationController.js # XP awards, streaks, badge checking
│   │   ├── leaderboardController.js # Rankings with pagination
│   │   ├── flashcardController.js   # Due cards, review submission, new cards
│   │   └── analyticsController.js   # Weekly aggregation, sign breakdown, trends
│   ├── services/
│   │   ├── spacedRepetition.js      # SM-2 algorithm implementation
│   │   └── achievementChecker.js    # Automatic badge unlock evaluation
│   ├── jobs/
│   │   └── scheduler.js            # Weekly/monthly leaderboard reset, streak checks
│   └── utils/
│       └── xpCalculator.js          # XP rewards & progressive level curve
├── tests/
│   ├── spacedRepetition.test.js     # SM-2 algorithm unit tests
│   ├── xpCalculator.test.js         # XP/leveling unit tests
│   └── api.test.js                  # API route integration tests
├── .github/workflows/
│   └── ci-cd.yml                    # GitHub Actions CI/CD pipeline
├── Dockerfile                       # Multi-stage production container
├── docker-compose.yml               # Local dev stack with MongoDB
├── ecosystem.config.js              # PM2 config (staging + production)
├── jest.config.js                   # Test configuration
├── .env.example
├── .gitignore
└── package.json
```

## API Endpoints

### Users — `/api/users`
- `POST /register` — Register new user from Firebase token
- `GET /me` — Get own profile
- `PUT /me` — Update display name, photo, preferences
- `GET /me/stats` — Get own stats summary
- `GET /:id/public` — View another user's public profile (no auth)

### Progress — `/api/progress`
- `POST /record` — Record a sign attempt (updates SR schedule)
- `GET /overview` — Get all signs progress overview
- `GET /sign/:sign` — Get progress for a specific sign
- `GET /due-reviews` — Get signs due for spaced repetition review
- `POST /session` — Record a practice/test session
- `GET /sessions` — Get paginated session history

### Flashcards — `/api/flashcards`
- `GET /due` — Get prioritized due flashcards
- `POST /review` — Submit flashcard review (easy/good/hard)
- `GET /new` — Get unlearned signs to introduce
- `GET /stats` — Flashcard system statistics

### Gamification — `/api/gamification`
- `POST /xp` — Award XP (triggers achievement check)
- `GET /streak` — Get current streak info
- `POST /streak/checkin` — Record daily check-in
- `POST /streak/freeze` — Use a streak freeze
- `GET /achievements` — Get earned achievements
- `GET /achievements/available` — Get all badges with unlock status
- `GET /level` — Get level and XP progress

### Leaderboard — `/api/leaderboard`
- `GET /global` — All-time XP rankings (public)
- `GET /weekly` — Weekly XP rankings (public)
- `GET /monthly` — Monthly XP rankings (public)
- `GET /me` — Get own rank

### Analytics — `/api/analytics`
- `GET /weekly-summary` — 7-day aggregated progress dashboard
- `GET /sign-breakdown` — Per-sign accuracy analysis
- `GET /learning-trend` — 30-day learning trend data

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Testing

```bash
npm test                   # Run all tests
npm run test:coverage      # Run with coverage report
npm run test:watch         # Watch mode
```

## Docker

```bash
docker compose up -d                                    # Local dev with MongoDB
docker build -t signlex-backend .                       # Production image
docker run -p 5000:5000 --env-file .env signlex-backend # Run container
```

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci-cd.yml`):
1. Every push/PR → lint + run all tests with MongoDB service container
2. Push to `develop` → auto-deploy to staging via SSH + PM2
3. Push to `main` → auto-deploy to production (cluster mode) with health check rollback

## Status (Report Meeting #2)
- Checkpoint 4 (Interactive Learning Module APIs): **100% ✅**
- Checkpoint 5 (Gamification System Backend): **100% ✅**
- Checkpoint 6 (ML Model — backend integration ready): **90% ⚠️**
- SM-2 Flashcard System: **100% ✅**
- Analytics & Weekly Summaries: **100% ✅**
- Achievement Auto-Unlock: **100% ✅**
- Scheduled Jobs (Leaderboard Reset): **100% ✅**
- CI/CD Pipeline: **100% ✅**
- Test Suite: **100% ✅**
