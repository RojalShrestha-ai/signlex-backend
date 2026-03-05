
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const progressController = require("../controllers/progressController");

router.post("/record", requireAuth, progressController.recordAttempt);
router.get("/overview", requireAuth, progressController.getOverview);
router.get("/sign/:sign", requireAuth, progressController.getSignProgress);
router.get("/due-reviews", requireAuth, progressController.getDueReviews);
router.post("/session", requireAuth, progressController.recordSession);
router.get("/sessions", requireAuth, progressController.getSessionHistory);

module.exports = router;
