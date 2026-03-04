/**
 * SignLex Backend - User Controller
 * Author: Amin Memon
 *
 * Handles user registration, profile retrieval, and updates.
 * Creates MongoDB user record linked to Firebase UID.
 *
 * Status: ~15% - Register and getProfile implemented,
 *   update and stats are basic shells.
 */

const User = require("../models/User");

/**
 * POST /api/users/register
 * Create or return existing user after Firebase signup.
 */
const registerUser = async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;
    const { displayName, authProvider } = req.body;

    // Check if user already exists
    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      return res.status(200).json({
        message: "User already exists",
        user: sanitizeUser(user),
      });
    }

    // Create new user
    user = await User.create({
      firebaseUid: uid,
      email: email,
      displayName: displayName || name || "Learner",
      photoURL: picture || null,
      authProvider: authProvider || "email",
    });

    console.log(`New user registered: ${user.email}`);

    res.status(201).json({
      message: "User registered successfully",
      user: sanitizeUser(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "User already exists" });
    }
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Failed to register user" });
  }
};

/**
 * GET /api/users/me
 * Get the authenticated user's full profile.
 */
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/**
 * PUT /api/users/me
 * Update the authenticated user's profile.
 */
const updateMyProfile = async (req, res) => {
  try {
    const allowedUpdates = ["displayName", "photoURL", "preferences"];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile updated", user: sanitizeUser(user) });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

/**
 * GET /api/users/me/stats
 * Get current user's stats summary.
 */
const getMyStats = async (req, res) => {
  try {
    const user = await User.findOne(
      { firebaseUid: req.user.uid },
      "stats streakFreezeCount"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      stats: user.stats,
      streakFreezes: user.streakFreezeCount,
    });
  } catch (err) {
    console.error("Get stats error:", err.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

/**
 * GET /api/users/:id/public
 * Get a user's public-facing profile (limited fields).
 */
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "displayName photoURL stats.totalXP stats.currentLevel stats.currentStreak stats.signsLearned"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Get public profile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/**
 * Strip sensitive fields from user object before sending to client.
 */
function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.__v;
  delete obj.firebaseUid;
  return obj;
}

module.exports = {
  registerUser,
  getMyProfile,
  updateMyProfile,
  getMyStats,
  getPublicProfile,
};
