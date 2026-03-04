# SignLex Backend - Node.js/Express API Server

## Author: Amin Memon (Backend Lead / Systems Architect)

## Overview
RESTful API server for SignLex built with Node.js, Express, and MongoDB.
Handles user authentication, progress tracking, gamification, and leaderboards.

## Project Structure
```
amin/
├── src/
│   ├── server.js                # Express app entry point
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── firebase.js          # Firebase Admin SDK
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Progress.js          # Learning progress schema
│   │   ├── Achievement.js       # Achievement/badge schema
│   │   ├── Leaderboard.js       # Leaderboard schema
│   │   └── Session.js           # Practice session schema
│   ├── middleware/
│   │   └── authMiddleware.js    # Firebase token verification
│   ├── routes/
│   │   ├── userRoutes.js        # User CRUD endpoints
│   │   ├── progressRoutes.js    # Progress tracking endpoints
│   │   ├── gamificationRoutes.js # XP/streak/achievement endpoints
│   │   └── leaderboardRoutes.js # Leaderboard endpoints
│   ├── controllers/
│   │   ├── userController.js    # User logic
│   │   ├── progressController.js # Progress logic
│   │   ├── gamificationController.js # Gamification logic
│   │   └── leaderboardController.js  # Leaderboard logic
│   ├── services/
│   │   └── spacedRepetition.js  # SM-2 algorithm
│   └── utils/
│       └── xpCalculator.js      # XP/level calculations
├── .env.example
└── package.json
```

## Status (Report Meeting #1)
- **Goal 1 (Backend Infrastructure): ~30%** - Server, DB, schemas, routes
- **Goal 2 (Auth & User APIs): ~15%** - Firebase middleware, user controller shell
- **Goal 3 (Gamification & Leaderboard): ~10%** - SM-2 stub, XP calc stub, route stubs

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```
