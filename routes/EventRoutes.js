const express = require("express");
const router = express.Router();
const db = require("../config/db");

const getEventById = async (req, res) => {
    const eventId = req.params.id || req.params.eventId;

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
            `SELECT role_id AS id, role_name AS name, slots_needed, slots_filled
             FROM event_roles
             WHERE event_id = $1
             AND slots_filled < slots_needed`,
            [eventId] // <--- THE FIX: Passing the eventId parameter here
        );

        res.json({
            ...eventResult.rows[0],
            availableRoles: rolesResult.rows,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching event details" });
    }
};

// Supporting both router mapping patterns
router.get("/:eventId", getEventById);

module.exports = router;