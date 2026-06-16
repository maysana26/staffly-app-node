const db = require("../config/db");

// 1. Get Dashboard Stats

const getDashboardStats = async (req, res) => {

    try {

        const eventsCount = await db.query(`

            SELECT COUNT(*) 

            FROM events

        `);

        const applicationsCount = await db.query(`

            SELECT COUNT(*) 

            FROM applications

        `);

        const usersCount = await db.query(`

            SELECT COUNT(*) 

            FROM users

        `);

        const upcomingEventsCount = await db.query(`

            SELECT COUNT(*)

            FROM events

            WHERE date >= CURRENT_DATE

        `);

        const recentApplications = await db.query(`

            SELECT

                a.application_id,

                a.applicant_id,

                a.applied_at,

                a.status,

                u.name AS "applicantName",

                e.title AS "eventTitle",

                er.role_name AS "role"

            FROM applications a

            JOIN users u

                ON a.applicant_id = u.user_id

            JOIN event_roles er

                ON a.role_id = er.role_id

            JOIN events e

                ON er.event_id = e.event_id

            ORDER BY a.applied_at DESC

            LIMIT 5

        `);

        return res.json({

            totalEventsCreated:

                Number(eventsCount.rows[0].count) || 0,

            totalIncomingApplications:

                Number(applicationsCount.rows[0].count) || 0,

            activeUsers:

                Number(usersCount.rows[0].count) || 0,

            upcomingCount:

                Number(upcomingEventsCount.rows[0].count) || 0,

            recentApplications: recentApplications.rows

        });

    } catch (err) {

        console.error("Dashboard stats error:", {

            message: err.message,

            code: err.code,

            detail: err.detail

        });

        return res.status(500).json({

            message: "Server error fetching dashboard stats.",

            detail: err.message

        });

    }

};

// 2. Get Admin Events

const getAdminEvents = async (req, res) => {

    try {

        const result = await db.query(`

            SELECT

                e.*,
 
                COALESCE(role_summary.slots_needed, 0)::INTEGER

                    AS slots_needed,
 
                COALESCE(application_summary.application_count, 0)::INTEGER

                    AS application_count,
 
                COALESCE(application_summary.slots_filled, 0)::INTEGER

                    AS slots_filled
 
            FROM events e
 
            LEFT JOIN (

                SELECT

                    event_id,

                    SUM(COALESCE(slots_needed, 0)) AS slots_needed

                FROM event_roles

                GROUP BY event_id

            ) role_summary

                ON role_summary.event_id = e.event_id
 
            LEFT JOIN (

                SELECT

                    er.event_id,
 
                    COUNT(a.application_id)

                        AS application_count,
 
                    COUNT(a.application_id) FILTER (

                        WHERE LOWER(a.status) = 'accepted'

                    ) AS slots_filled
 
                FROM event_roles er
 
                LEFT JOIN applications a

                    ON a.role_id = er.role_id
 
                GROUP BY er.event_id

            ) application_summary

                ON application_summary.event_id = e.event_id
 
            ORDER BY e.date ASC

        `);

        return res.json(result.rows);

    } catch (err) {

        console.error("Get admin events error:", {

            message: err.message,

            code: err.code,

            detail: err.detail

        });

        return res.status(500).json({

            message: "Server error fetching admin events.",

            detail: err.message

        });

    }

};

// 3. Create Event

const createEvent = async (req, res) => {

    const {

        title,

        location,

        date,

        category,

        description

    } = req.body;

    if (!title || !location || !date) {

        return res.status(400).json({

            message: "Title, location, and date are required."

        });

    }

    try {

        const queryText = `

            INSERT INTO events (

                title,

                location,

                date,

                category,

                description,

                created_by

            )

            VALUES ($1, $2, $3, $4, $5, $6)

            RETURNING *

        `;

        const createdBy =

            req.user?.user_id ||

            req.user?.id ||

            1;

        const result = await db.query(queryText, [

            title.trim(),

            location.trim(),

            date,

            category || "General",

            description || "",

            createdBy

        ]);

        return res.status(201).json({

            message: "Event created successfully in database!",

            event: result.rows[0]

        });

    } catch (err) {

        console.error("Create event error:", {

            message: err.message,

            code: err.code,

            detail: err.detail

        });

        return res.status(500).json({

            message: "Server error creating event.",

            detail: err.message

        });

    }

};

// 4. Edit Event

const editEvent = async (req, res) => {

    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {

        return res.status(400).json({

            message: "A valid event ID is required."

        });

    }

    const {

        title,

        location,

        date,

        category,

        description

    } = req.body;

    try {

        const queryText = `

            UPDATE events

            SET

                title = COALESCE($1, title),

                location = COALESCE($2, location),

                date = COALESCE($3, date),

                category = COALESCE($4, category),

                description = COALESCE($5, description)

            WHERE event_id = $6

            RETURNING *

        `;

        const result = await db.query(queryText, [

            title || null,

            location || null,

            date || null,

            category || null,

            description ?? null,

            eventId

        ]);

        if (result.rows.length === 0) {

            return res.status(404).json({

                message: "Target event not found."

            });

        }

        return res.json({

            message: "Event updated successfully in database!",

            updatedEvent: result.rows[0]

        });

    } catch (err) {

        console.error("Edit event error:", {

            message: err.message,

            code: err.code,

            detail: err.detail

        });

        return res.status(500).json({

            message: "Server error updating event.",

            detail: err.message

        });

    }

};

// 5. Delete Event

const deleteEvent = async (req, res) => {

    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {

        return res.status(400).json({

            message: "A valid event ID is required."

        });

    }

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        await client.query(

            `

                DELETE FROM applications

                WHERE role_id IN (

                    SELECT role_id

                    FROM event_roles

                    WHERE event_id = $1

                )

            `,

            [eventId]

        );

        await client.query(

            `

                DELETE FROM event_roles

                WHERE event_id = $1

            `,

            [eventId]

        );

        const result = await client.query(

            `

                DELETE FROM events

                WHERE event_id = $1

                RETURNING event_id, title

            `,

            [eventId]

        );

        if (result.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({

                message: "Event not found."

            });

        }

        await client.query("COMMIT");

        return res.json({

            message: "Event deleted successfully.",

            deletedEvent: result.rows[0]

        });

    } catch (err) {

        await client.query("ROLLBACK");

        console.error("Delete event error:", {

            message: err.message,

            code: err.code,

            detail: err.detail

        });

        return res.status(500).json({

            message: "Server error deleting event.",

            detail: err.message

        });

    } finally {

        client.release();

    }

};

// 6. Get Incoming Applications

const getApplications = async (req, res) => {

    try {

        const result = await db.query(`

            SELECT

                a.application_id,

                a.applicant_id,

                a.applied_at,

                a.status,

                u.name AS "applicantName",

                e.title AS "eventTitle",

                er.role_name AS "role"

            FROM applications a

            JOIN users u

                ON a.applicant_id = u.user_id

            JOIN event_roles er

                ON a.role_id = er.role_id

            JOIN events e

                ON er.event_id = e.event_id

            ORDER BY a.applied_at DESC

        `);

        return res.json(result.rows);

    } catch (err) {

        console.error("Get applications error:", {

            message: err.message,

            code: err.code,

            detail: err.detail

        });

        return res.status(500).json({

            message: "Server error fetching applications.",

            detail: err.message

        });

    }

};

// 7. Update Application Status

const updateApplicationStatus = async (req, res) => {

    const applicationId = Number(req.params.id);

    if (

        !Number.isInteger(applicationId) ||

        applicationId <= 0

    ) {

        return res.status(400).json({

            message: "A valid application ID is required."

        });

    }

    const incomingStatus = String(

        req.body.status || ""

    ).trim();

    const statusMap = {

        pending: "Pending",

        accepted: "Accepted",

        approved: "Accepted",

        declined: "Declined",

        rejected: "Declined"

    };

    const normalizedStatus =

        statusMap[incomingStatus.toLowerCase()];

    if (!normalizedStatus) {

        return res.status(400).json({

            message:

                "Invalid application status. Use Pending, Accepted, or Declined."

        });

    }

    try {

        const result = await db.query(

            `

                UPDATE applications

                SET status = $1

                WHERE application_id = $2

                RETURNING application_id, applicant_id, role_id, status

            `,

            [normalizedStatus, applicationId]

        );

        if (result.rows.length === 0) {

            return res.status(404).json({

                message: "Application not found."

            });

        }

        return res.json({

            message:

                normalizedStatus === "Accepted"

                    ? "Application approved successfully."

                    : normalizedStatus === "Declined"

                        ? "Application declined successfully."

                        : "Application status updated successfully.",

            application: result.rows[0]

        });

    } catch (err) {

        console.error("Application status update error:", {

            message: err.message,

            code: err.code,

            detail: err.detail,

            constraint: err.constraint,

            applicationId,

            status: normalizedStatus

        });

        return res.status(500).json({

            message: "Server error updating application status.",

            detail: err.message

        });

    }

};
const getAdminEventDetails = async (req, res) => {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "A valid event ID is required."
        });
    }

    try {
        const eventResult = await db.query(
            `
                SELECT
                    e.*,
 
                    COALESCE(
                        SUM(DISTINCT er.slots_needed),
                        0
                    )::INTEGER AS slots_needed,
 
                    COUNT(
                        DISTINCT CASE
                            WHEN LOWER(a.status) = 'accepted'
                            THEN a.application_id
                        END
                    )::INTEGER AS slots_filled,
 
                    COUNT(
                        DISTINCT a.application_id
                    )::INTEGER AS application_count
 
                FROM events e
 
                LEFT JOIN event_roles er
                    ON er.event_id = e.event_id
 
                LEFT JOIN applications a
                    ON a.role_id = er.role_id
 
                WHERE e.event_id = $1
 
                GROUP BY e.event_id
            `,
            [eventId]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                message: "Event not found."
            });
        }

        const rolesResult = await db.query(
            `
                SELECT
                    er.role_id,
                    er.role_name,
                    er.description,
                    er.slots_needed,
 
                    COUNT(
                        CASE
                            WHEN LOWER(a.status) = 'accepted'
                            THEN 1
                        END
                    )::INTEGER AS filled_slots
 
                FROM event_roles er
 
                LEFT JOIN applications a
                    ON a.role_id = er.role_id
 
                WHERE er.event_id = $1
 
                GROUP BY
                    er.role_id,
                    er.role_name,
                    er.description,
                    er.slots_needed
 
                ORDER BY er.role_id
            `,
            [eventId]
        );

        const applicationsResult = await db.query(
            `
                SELECT
                    a.application_id,
                    a.applicant_id,
                    a.applied_at,
                    a.status,
                    a.user_notes AS "message",
 
                    u.name AS "applicantName",
                    u.email AS "applicantEmail",
 
                    er.role_id,
                    er.role_name AS "role"
 
                FROM applications a
 
                JOIN users u
                    ON u.user_id = a.applicant_id
 
                JOIN event_roles er
                    ON er.role_id = a.role_id
 
                WHERE er.event_id = $1
 
                ORDER BY a.applied_at DESC
            `,
            [eventId]
        );

        return res.json({
            event: eventResult.rows[0],
            roles: rolesResult.rows,
            applications: applicationsResult.rows
        });
    } catch (err) {
        console.error("Get admin event details error:", {
            message: err.message,
            code: err.code,
            detail: err.detail
        });

        return res.status(500).json({
            message: "Server error loading event details.",
            detail: err.message
        });
    }
};

module.exports = {

    getDashboardStats,
    getAdminEvents,
    createEvent,
    editEvent,
    deleteEvent,
    getApplications,
    updateApplicationStatus,
    getAdminEventDetails
};
