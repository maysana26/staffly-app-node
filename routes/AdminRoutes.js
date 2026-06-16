const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { isAdmin } = require("../middlewares/authMiddleware");

// Dashboard
router.get(
    "/summary",
    isAdmin,
    adminController.getDashboardStats
);

router.get(
    "/dashboard-stats",
    isAdmin,
    adminController.getDashboardStats
);

// Events
router.get(
    "/events",
    isAdmin,
    adminController.getAdminEvents
);

router.post(
    "/events",
    isAdmin,
    adminController.createEvent
);

router.post(
    "/create-event",
    isAdmin,
    adminController.createEvent
);

router.put(
    "/events/:id",
    isAdmin,
    adminController.editEvent
);

router.put(
    "/edit-event/:id",
    isAdmin,
    adminController.editEvent
);

router.delete(
    "/events/:id",
    isAdmin,
    adminController.deleteEvent
);

// Applications
router.get(
    "/applications",
    isAdmin,
    adminController.getApplications
);

router.put(
    "/applications/:id/status",
    isAdmin,
    adminController.updateApplicationStatus
);

router.get(
    "/events/:id/details",
    isAdmin,
    adminController.getAdminEventDetails
);
module.exports = router;