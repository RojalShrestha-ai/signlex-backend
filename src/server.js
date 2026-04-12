require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const progressRoutes = require("./routes/progressRoutes");
const gamificationRoutes = require("./routes/gamificationRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const flashcardRoutes = require("./routes/flashcardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");


const { initScheduler } = require("./jobs/scheduler");

const app = express();
const PORT = process.env.PORT || 5000;


app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/v1/", limiter);


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}


app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    service: "signlex-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/gamification", gamificationRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/flashcards", flashcardRoutes);
app.use("/api/v1/analytics", analyticsRoutes);


app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

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