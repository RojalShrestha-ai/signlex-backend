const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const registerUser = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password, and displayName are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const user = await User.create({
      email,
      password,
      displayName,
    });

    const token = generateToken(user);

    console.log(`New user registered: ${user.email}`);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Failed to register user" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Failed to login" });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const allowedUpdates = ["displayName", "photoURL", "preferences"];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
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

const getMyStats = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.id,
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

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.__v;
  delete obj.password;
  return obj;
}

module.exports = {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  getMyStats,
  getPublicProfile,
};
