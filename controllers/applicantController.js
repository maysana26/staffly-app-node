const db = require("../config/db");

// 1. Explore Available Event Roles
const getExploreEvents = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT e.event_id, e.title, e.location, e.date, er.role_id, er.role_name, er.slots_needed, er.slots_filled
            FROM events e
            JOIN event_roles er ON e.event_id = er.event_id
            WHERE er.slots_filled < er.slots_needed AND e.date > NOW()
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching explore feed" });
    }
};

// 2. Register / Apply for a specific Role Slot
const registerForEvent = async (req, res) => {
    const { roleId, applicantId } = req.body; // Sent from frontend selection
    try {
        // Insert application row
        const appQuery = `
            INSERT INTO applications (applicant_id, role_id, status)
            VALUES ($1, $2, 'Pending') RETURNING *
        `;
        const result = await db.query(appQuery, [applicantId, roleId]);
        res.status(201).json({ message: "Application submitted successfully to database!", registration: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error during role registration" });
    }
};

// 3. Get Applicant's Registered Shifts (With 48-Hour Lock-in Check!)
const getMyEvents = async (req, res) => {
    const applicantId = req.query.applicantId;
    try {
        const queryText = `
            SELECT a.application_id, e.title, er.role_name as "role", e.location, e.date, a.status,
                   (e.date - NOW() > INTERVAL '48 hours') AS "canCancel"
            FROM applications a
            JOIN event_roles er ON a.role_id = er.role_id
            JOIN events e ON er.event_id = e.event_id
            WHERE a.applicant_id = $1
        `;
        const result = await db.query(queryText, [applicantId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching registered events" });
    }
};

// 4. Fetch Profile Page Info
const getProfile = async (req, res) => {
    const email = req.query.email;
    try {
        const result = await db.query("SELECT name, email, role, rating, total_events, member_since, about, skills FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Profile not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching profile" });
    }
};

// 5. Submit Admin-to-Applicant Performance Feedback
const submitFeedback = async (req, res) => {
    const { eventId, adminId, applicantId, ratingScore, comment, points } = req.body;
    try {
        const queryText = `
            INSERT INTO feedback (event_id, admin_id, applicant_id, rating_score, experience_comment, points_awarded)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `;
        const result = await db.query(queryText, [eventId, adminId, applicantId, ratingScore, comment, points]);
        res.status(201).json({ message: "Feedback performance tracking updated successfully.", data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error saving evaluation metrics" });
    }
};

module.exports = { getExploreEvents, registerForEvent, getMyEvents, getProfile, submitFeedback };