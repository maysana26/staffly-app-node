const express = require("express");
const router = express.Router();

// Import Controller functions
const applicantController = require("../controllers/applicantController");
const authController = require("../controllers/authController");
const db = require("../config/db");

// Public Authentication Endpoints
router.post("/login", authController.login);
router.post("/signup", authController.signup);

// Private Applicant Endpoints
router.get("/explore-events", applicantController.getExploreEvents);
router.post("/register", applicantController.registerForEvent);
router.get("/myevents", applicantController.getMyEvents);
router.get("/profile", applicantController.getProfile);
router.put("/profile/update", applicantController.updateProfile);
router.post("/feedback", applicantController.submitFeedback);
router.get("/events/:eventId", applicantController.getEventById);

// Private Cancellation Handler Endpoint
router.delete("/my-applications/:id", async (req, res) => {
    const applicationId = req.params.id;
    try {
        await db.query("DELETE FROM applications WHERE application_id = $1", [applicationId]);
        res.json({ message: "Application data entry successfully cleared out from database registry rows." });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Database link processing exception run crash during deletion operations." });
    }
});

// CRITICAL FIX: Export the router instance directly!
module.exports = router;