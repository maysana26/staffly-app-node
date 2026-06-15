const db = require("../config/db");

// 1. Get Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        const eventsCount = await db.query("SELECT COUNT(*) FROM events");
        const appsCount = await db.query("SELECT COUNT(*) FROM applications");

        const recentApps = await db.query(`
            SELECT a.application_id, u.name as "applicantName", e.title as "eventTitle", er.role_name as "role", a.status
            FROM applications a
            JOIN users u ON a.applicant_id = u.user_id
            JOIN event_roles er ON a.role_id = er.role_id
            JOIN events e ON er.event_id = e.event_id
            ORDER BY a.applied_at DESC LIMIT 5
        `);

        res.json({
            totalEventsCreated: parseInt(eventsCount.rows[0].count),
            totalIncomingApplications: parseInt(appsCount.rows[0].count),
            recentApplications: recentApps.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching dashboard stats" });
    }
};

// 2. Get Admin Events
const getAdminEvents = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM events ORDER BY date ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching admin events" });
    }
};

// 3. Create Event
const createEvent = async (req, res) => {
    const { title, location, date, category, description } = req.body;
    try {
        const queryText = `
            INSERT INTO events (title, location, date, category, description, created_by)
            VALUES ($1, $2, $3, $4, $5, 1) 
            RETURNING *
        `;
        const result = await db.query(queryText, [title, location, date, category || "General", description || ""]);
        res.status(201).json({ message: "Event created successfully in database!", event: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error creating event" });
    }
};

// 4. Edit Event
const editEvent = async (req, res) => {
    const eventId = parseInt(req.params.id);
    const { title, location, date, category, description } = req.body;
    try {
        const queryText = `
            UPDATE events 
            SET title = COALESCE($1, title), location = COALESCE($2, location), 
                date = COALESCE($3, date), category = COALESCE($4, category), 
                description = COALESCE($5, description)
            WHERE event_id = $6 RETURNING *
        `;
        const result = await db.query(queryText, [title, location, date, category, description, eventId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Target event not found" });
        }
        res.json({ message: "Event updated successfully in database!", updatedEvent: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error updating event" });
    }
};

// 5. Get Incoming Applications
const getApplications = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.application_id, u.name as "applicantName", e.title as "eventTitle", er.role_name as "role", a.status
            FROM applications a
            JOIN users u ON a.applicant_id = u.user_id
            JOIN event_roles er ON a.role_id = er.role_id
            JOIN events e ON er.event_id = e.event_id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching applications" });
    }
};

module.exports = { getDashboardStats, getAdminEvents, createEvent, editEvent, getApplications };