const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/me", requireAuth, userController.getMyProfile);
router.put("/me", requireAuth, userController.updateMyProfile);
router.get("/me/stats", requireAuth, userController.getMyStats);
router.get("/:id/public", userController.getPublicProfile);

module.exports = router;
