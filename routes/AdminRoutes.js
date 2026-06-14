const express = require("express");
const router = express.Router();

// Import Controller functions
const adminController = require("../controllers/adminController");

// Import Middleware guards
const { isAdmin } = require("../middlewares/authMiddleware");

// Admin Endpoint Configurations (Protected by isAdmin middleware)
router.get("/dashboard-stats", isAdmin, adminController.getDashboardStats);
router.get("/events", isAdmin, adminController.getAdminEvents);
router.post("/create-event", isAdmin, adminController.createEvent);
router.put("/edit-event/:id", isAdmin, adminController.editEvent);
router.get("/applications", isAdmin, adminController.getApplications);

module.exports = router;