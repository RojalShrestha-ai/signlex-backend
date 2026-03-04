/**
 * SignLex Backend - User Routes
 * Author: Amin Memon
 *
 * RESTful endpoints for user CRUD operations.
 * All routes require authentication via Firebase token.
 */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

// POST /api/users/register - Create or update user after Firebase signup
router.post("/register", requireAuth, userController.registerUser);

// GET /api/users/me - Get current user's profile
router.get("/me", requireAuth, userController.getMyProfile);

// PUT /api/users/me - Update current user's profile
router.put("/me", requireAuth, userController.updateMyProfile);

// GET /api/users/me/stats - Get current user's stats summary
router.get("/me/stats", requireAuth, userController.getMyStats);

// GET /api/users/:id/public - Get another user's public profile
router.get("/:id/public", userController.getPublicProfile);

module.exports = router;
