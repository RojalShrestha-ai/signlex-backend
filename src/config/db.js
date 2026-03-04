/**
 * SignLex Backend - MongoDB Connection
 * Author: Amin Memon
 *
 * Establishes and manages the MongoDB connection using Mongoose.
 * Includes retry logic and connection event handlers.
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/signlex";

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 8 uses these defaults, but being explicit
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Connection event handlers
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting reconnection...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully");
    });

    return conn;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    // Retry after 5 seconds
    console.log("Retrying connection in 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return connectDB();
  }
};

module.exports = connectDB;
