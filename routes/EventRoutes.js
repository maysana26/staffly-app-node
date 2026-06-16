const express = require("express");
const router = express.Router();
const db = require("../config/db");
const adminController = require("../controllers/adminController");

const getEventById = async (req, res) => {
    const eventId = req.params.eventId;

    try {
        const eventResult = await db.query(
            `SELECT event_id, title, location, date, category, description
             FROM events
             WHERE event_id = $1`,
            [eventId]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        const rolesResult = await db.query(
            `SELECT role_id AS id,
                    role_id,
                    role_name AS name,
                    role_name,
                    slots_needed AS slots,
                    slots_needed,
                    slots_filled,
                    slots_needed - slots_filled AS spots,
                    '' AS description
             FROM event_roles
             WHERE event_id = $1`,
            [eventId]
        );

        res.json({
            ...eventResult.rows[0],
            roles: rolesResult.rows,
            availableRoles: rolesResult.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching event details" });
    }
};

router.get("/", adminController.getAdminEvents);
router.post("/", adminController.createEvent);
router.put("/:eventId", adminController.editEvent);
router.delete("/:eventId", adminController.deleteEvent);
router.get("/:eventId", getEventById);

module.exports = router;