const express = require("express");
const router = express.Router();

// Import Controller functions
const authController = require("../controllers/authController");
const applicantController = require("../controllers/applicantController");

// Public Authentication Endpoints
router.post("/login", authController.login);
router.post("/signup", authController.signup);

// Private Applicant Endpoints
router.get("/explore-events", applicantController.getExploreEvents);
router.post("/register/:eventId", applicantController.registerForEvent);
router.get("/myevents", applicantController.getMyEvents);
router.get("/profile", applicantController.getProfile);
router.post("/feedback", applicantController.submitFeedback);

module.exports = router;