const db = require("../config/db");

const getEventById = async (req, res) => {
    const eventId = req.params.id;

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
            [eventId]
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

module.exports = { getEventById };