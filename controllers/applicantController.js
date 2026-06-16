const db = require("../config/db");
console.log("APPLICANT CONTROLLER LOADED");

// 1. Explore Available Event Roles
const getExploreEvents = async (req, res) => {
    console.log("EXPLORE EVENTS ROUTE HIT");
    try {
        const result = await db.query(`
            SELECT e.event_id,
                   e.title,
                   e.location,
                   TO_CHAR(e.date, 'YYYY-MM-DD') AS date,
                   e.category,
                   e.description,
                   '/event-placeholder.jpg' AS image,
                   er.role_id, er.role_name,
                   er.slots_needed, er.slots_filled
            FROM events e
            JOIN event_roles er ON e.event_id = er.event_id
            WHERE er.slots_filled < er.slots_needed
            AND e.date > NOW()
            ORDER BY e.date ASC, e.title ASC, er.role_name ASC
        `);
        console.log("ROWS:", result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error exploring events" });
    }
};

// 2. Register / Apply for a specific Role Slot with automatic capacity tracking
const registerForEvent = async (req, res) => {
    const { roleId, applicantId } = req.body;

    if (!roleId || !applicantId) {
        return res.status(400).json({ message: "Missing required roleId or applicantId credentials." });
    }

    let client;
    try {
        client = await db.getClient();
        await client.query("BEGIN");

        // Check if capacity is already exhausted
        const capacityCheck = await client.query(
            "SELECT slots_filled, slots_needed FROM event_roles WHERE role_id = $1 FOR UPDATE",
            [roleId]
        );

        if (capacityCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Target role layout structure not found." });
        }

        const { slots_filled, slots_needed } = capacityCheck.rows[0];
        if (slots_filled >= slots_needed) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "This role has already filled all its capacity!" });
        }

        // Insert new application entry
        const appQuery = `
            INSERT INTO applications (applicant_id, role_id, status)
            VALUES ($1, $2, 'Pending') RETURNING *
        `;
        const appResult = await client.query(appQuery, [applicantId, roleId]);

        // Increment dynamic structural counters inside database rows
        await client.query(
            "UPDATE event_roles SET slots_filled = slots_filled + 1 WHERE role_id = $1",
            [roleId]
        );

        await client.query("COMMIT");
        res.status(201).json({
            message: "Application submitted successfully to database!",
            registration: appResult.rows[0]
        });

    } catch (err) {
        if (client) {
            await client.query("ROLLBACK");
        }
        if (err.code === '23505') {
            return res.status(400).json({ message: "You have already applied for this role slot!" });
        }
        console.error("Error during assignment execution paths:", err.message);
        res.status(500).json({ message: "Server error during role registration" });
    } finally {
        if (client) {
            client.release();
        }
    }
};

// 3. Get Applicant's Registered Shifts
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
        const userResult = await db.query(
            "SELECT user_id, name, email, role, rating, total_events, member_since, about, skills FROM users WHERE email = $1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const user = userResult.rows[0];

        let parsedSkills = [];
        if (user.skills) {
            if (Array.isArray(user.skills)) {
                parsedSkills = user.skills;
            } else if (typeof user.skills === 'string') {
                parsedSkills = user.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
            }
        }

        const expQuery = `
            SELECT f.feedback_id AS id, e.title, er.role_name AS role, 
                   TO_CHAR(e.date, 'YYYY-MM-DD') AS date, f.rating_score AS rating
            FROM feedback f
            JOIN events e ON f.event_id = e.event_id
            JOIN applications a ON f.applicant_id = a.applicant_id
            JOIN event_roles er ON a.role_id = er.role_id
            WHERE f.applicant_id = $1
        `;
        const expResult = await db.query(expQuery, [user.user_id]);

        const eventsQuery = `
            SELECT 
                a.application_id AS id, 
                e.title, 
                a.status, 
                er.role_name AS role, 
                e.location, 
                TO_CHAR(e.date, 'YYYY-MM-DD') AS date,
                'General' AS category,  
                'All Day' AS time      
            FROM applications a
            JOIN event_roles er ON a.role_id = er.role_id
            JOIN events e ON er.event_id = e.event_id
            WHERE a.applicant_id = $1
        `;
        const eventsResult = await db.query(eventsQuery, [user.user_id]);

        const completedProfilePayload = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            rating: user.rating,
            total_events: user.total_events || 0,
            member_since: user.member_since ? String(user.member_since) : "2026",
            about: user.about || "",
            skills: parsedSkills,
            experience: expResult.rows || [],
            registeredEvents: eventsResult.rows || []
        };

        res.json(completedProfilePayload);
    } catch (err) {
        console.error("Profile payload crash detailed logs:", err.message);
        res.status(500).json({ message: "Server error fetching profile" });
    }
};

// 4.5 Update Profile Data Row
const updateProfile = async (req, res) => {
    let { email, about, skills } = req.body;
    try {
        if (!email && req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decodedToken = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
            email = decodedToken.email;
        }

        if (!email) {
            return res.status(400).json({ message: "Identification error: Profile account email reference missing." });
        }

        const structuralSkillsString = Array.isArray(skills) ? skills.join(", ") : skills;

        const updateQuery = `
            UPDATE users 
            SET about = $1, skills = $2 
            WHERE email = $3 
            RETURNING about, skills
        `;
        const result = await db.query(updateQuery, [about, structuralSkillsString, email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User profile registry row missing." });
        }

        let responseSkills = [];
        if (result.rows[0].skills) {
            responseSkills = result.rows[0].skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }

        res.json({
            about: result.rows[0].about || "",
            skills: responseSkills
        });
    } catch (err) {
        console.error("Profile saving operational breakdown:", err.message);
        res.status(500).json({ message: "Server breakdown saving user profile elements." });
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

// FIX: Make sure this controller matches the schema parameters expected by our frontend layout mapping
const getEventById = async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const eventResult = await db.query(`SELECT * FROM events WHERE event_id = $1`, [eventId]);
        if (eventResult.rows.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        const rolesResult = await db.query(
            `SELECT role_id as id, role_name as name, slots_needed - slots_filled as spots, 'Available role description text' as desc
             FROM event_roles WHERE event_id = $1`, [eventId]
        );

        res.json({
            ...eventResult.rows[0],
            availableRoles: rolesResult.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching event" });
    }
};

module.exports = {
    getExploreEvents,
    registerForEvent,
    getMyEvents,
    getProfile,
    updateProfile,
    submitFeedback,
    getEventById
};