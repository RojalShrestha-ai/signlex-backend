/**
 * SignLex Backend - Express Server Entry Point
 * Author: Amin Memon
 *
 * Initializes Express app with security middleware, CORS,
 * database connection, and route mounting.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Import routes
const userRoutes = require("./routes/userRoutes");
const progressRoutes = require("./routes/progressRoutes");
const gamificationRoutes = require("./routes/gamificationRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const flashcardRoutes = require("./routes/flashcardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// Scheduled jobs
const { initScheduler } = require("./jobs/scheduler");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ── Body Parsing ──
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Health Check ──
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "signlex-backend",
    timestamp: new Date().toISOString(),
  });
});

// ── Mount Routes ──
app.use("/api/users", userRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/analytics", analyticsRoutes);

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ── Start Server ──
async function startServer() {
  try {
    await connectDB();
    initScheduler(); // Start scheduled jobs (leaderboard resets, streak checks)
    app.listen(PORT, () => {
      console.log(`SignLex API server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;