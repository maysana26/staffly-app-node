// console.log("APPLICANT CONTROLLER LOADED");

const db = require("../config/db");
const jwt = require("jsonwebtoken");

// 1. Explore Available Event Roles

const getExploreEvents = async (req, res) => {

    console.log("EXPLORE EVENTS ROUTE HIT");

    try {

        const result = await db.query(`

            SELECT

                e.event_id,

                e.title,

                e.location,

                e.date,

                e.category,

                e.description,

                e.image_url,
 
                er.role_id,

                er.role_name,


                er.slots_needed,
 
                COALESCE(er.slots_filled, 0) AS slots_filled,
 
                (

                    er.slots_needed -

                    COALESCE(er.slots_filled, 0)

                ) AS remaining_slots
 
            FROM events e
 
            JOIN event_roles er

                ON e.event_id = er.event_id
 
            WHERE

                COALESCE(er.slots_filled, 0) < er.slots_needed

                AND e.date >= CURRENT_DATE
 
            ORDER BY e.date ASC, e.event_id ASC

        `);

        console.log("EXPLORE EVENT ROWS:", result.rows.length);

        console.log(result.rows);

        return res.json(result.rows);

    } catch (err) {

        console.error("Explore events error:", {

            message: err.message,

            code: err.code,

            detail: err.detail

        });

        return res.status(500).json({

            message: "Server error exploring events",

            detail: err.message

        });

    }

};


// 2. Register / Apply for a specific Role Slot with automatic capacity tracking
const registerForEvent = async (req, res) => {
    const { roleId, applicantId } = req.body;

    if (!roleId || !applicantId) {
        return res.status(400).json({ message: "Missing required roleId or applicantId credentials." });
    }

    try {
        await db.query("BEGIN");

        // Check if capacity is already exhausted
        const capacityCheck = await db.query(
            "SELECT slots_filled, slots_needed FROM event_roles WHERE role_id = $1 FOR UPDATE",
            [roleId]
        );

        if (capacityCheck.rows.length === 0) {
            await db.query("ROLLBACK");
            return res.status(404).json({ message: "Target role layout structure not found." });
        }

        const { slots_filled, slots_needed } = capacityCheck.rows[0];
        if (slots_filled >= slots_needed) {
            await db.query("ROLLBACK");
            return res.status(400).json({ message: "This role has already filled all its capacity!" });
        }

        // Insert new application entry
        const appQuery = `
            INSERT INTO applications (applicant_id, role_id, status)
            VALUES ($1, $2, 'Pending') RETURNING *
        `;
        const appResult = await db.query(appQuery, [applicantId, roleId]);

        // Increment dynamic structural counters inside database rows
        await db.query(
            "UPDATE event_roles SET slots_filled = slots_filled + 1 WHERE role_id = $1",
            [roleId]
        );

        await db.query("COMMIT");
        res.status(201).json({
            message: "Application submitted successfully to database!",
            registration: appResult.rows[0]
        });

    } catch (err) {
        await db.query("ROLLBACK");
        if (err.code === '23505') {
            return res.status(400).json({ message: "You have already applied for this role slot!" });
        }
        console.error("Error during assignment execution paths:", err.message);
        res.status(500).json({ message: "Server error during role registration" });
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

    if (!email) {

        return res.status(400).json({

            message: "Email is required."

        });

    }

    try {

        const userResult = await db.query(

            `

                SELECT

                    user_id,

                    name,

                    email,

                    role,

                    rating,

                    member_since,

                    about,

                    skills

                FROM users

                WHERE email = $1

            `,

            [email]

        );

        if (userResult.rows.length === 0) {

            return res.status(404).json({

                message: "Profile not found"

            });

        }

        const user = userResult.rows[0];

        let parsedSkills = [];

        if (user.skills) {

            if (Array.isArray(user.skills)) {

                parsedSkills = user.skills;

            } else if (typeof user.skills === "string") {

                parsedSkills = user.skills

                    .split(",")

                    .map((skill) => skill.trim())

                    .filter((skill) => skill.length > 0);

            }

        }

        // Count the distinct events the user registered/applied for

        const totalEventsResult = await db.query(

            `

                SELECT

                    COUNT(DISTINCT er.event_id)::INTEGER AS total_events

                FROM applications a

                JOIN event_roles er

                    ON a.role_id = er.role_id

                WHERE a.applicant_id = $1

            `,

            [user.user_id]

        );

        const totalEvents =

            totalEventsResult.rows[0]?.total_events || 0;

        const expQuery = `

            SELECT

                f.feedback_id AS id,

                e.title,

                er.role_name AS role,

                TO_CHAR(e.date, 'YYYY-MM-DD') AS date,

                f.rating_score AS rating

            FROM feedback f

            JOIN events e

                ON f.event_id = e.event_id

            JOIN applications a

                ON f.applicant_id = a.applicant_id

            JOIN event_roles er

                ON a.role_id = er.role_id

                AND er.event_id = e.event_id

            WHERE f.applicant_id = $1

        `;

        const expResult = await db.query(

            expQuery,

            [user.user_id]

        );

        const eventsQuery = `

            SELECT

                a.application_id AS id,

                e.event_id,

                e.title,

                a.status,

                er.role_name AS role,

                e.location,

                TO_CHAR(e.date, 'YYYY-MM-DD') AS date,

                e.category,

                COALESCE(

                    TO_CHAR(e.date, 'HH24:MI'),

                    'All Day'

                ) AS time

            FROM applications a

            JOIN event_roles er

                ON a.role_id = er.role_id

            JOIN events e

                ON er.event_id = e.event_id

            WHERE a.applicant_id = $1

            ORDER BY e.date ASC

        `;

        const eventsResult = await db.query(

            eventsQuery,

            [user.user_id]

        );

        const completedProfilePayload = {

            user_id: user.user_id,

            name: user.name,

            email: user.email,

            role: user.role,

            rating: user.rating,

            total_events: totalEvents,

            member_since: user.member_since

                ? String(user.member_since)

                : "2026",

            about: user.about || "",

            skills: parsedSkills,

            experience: expResult.rows || [],

            registeredEvents: eventsResult.rows || []

        };

        return res.json(completedProfilePayload);

    } catch (err) {

        console.error(

            "Profile payload crash detailed logs:",

            {

                message: err.message,

                code: err.code,

                detail: err.detail

            }

        );

        return res.status(500).json({

            message: "Server error fetching profile",

            detail: err.message

        });

    }

};

// 4.5 Update Profile Data Row
// 4.5 Update Profile Data Row
const updateProfile = async (req, res) => {
    const { about, skills } = req.body;

    try {
        console.log("PROFILE UPDATE ROUTE HIT");
        console.log("PROFILE UPDATE BODY:", {
            about,
            skills,
            skillsType: Array.isArray(skills) ? "array" : typeof skills,
        });

        const authHeader = req.headers.authorization;

        console.log("PROFILE UPDATE AUTH HEADER EXISTS:", !!authHeader);
        console.log(
            "PROFILE UPDATE AUTH HEADER PREFIX:",
            authHeader ? authHeader.slice(0, 20) : null
        );

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Login token missing. Please log in again."
            });
        }

        const token = authHeader.split(" ")[1];

        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET || "fallback_secret_key_string"
        );

        const userId = decodedToken.user_id;

        console.log("PROFILE UPDATE DECODED TOKEN:", {
            user_id: decodedToken.user_id,
            role: decodedToken.role,
            exp: decodedToken.exp,
        });

        if (!userId) {
            return res.status(401).json({
                message: "Login token is missing the user account ID."
            });
        }

        const structuralSkillsValue = Array.isArray(skills)
            ? skills
            : String(skills || "")
                .split(",")
                .map((skill) => skill.trim())
                .filter((skill) => skill.length > 0);

        console.log("PROFILE UPDATE DB VALUES:", {
            userId,
            aboutLength: about ? about.length : 0,
            structuralSkillsValue,
        });

        const updateQuery = `
            UPDATE users
            SET about = $1, skills = $2
            WHERE user_id = $3
            RETURNING user_id, email, about, skills
        `;

        const result = await db.query(updateQuery, [
            about,
            structuralSkillsValue,
            userId
        ]);

        console.log("PROFILE UPDATE ROW COUNT:", result.rows.length);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User profile registry row missing."
            });
        }

        let responseSkills = [];

        if (Array.isArray(result.rows[0].skills)) {
            responseSkills = result.rows[0].skills;
        } else if (result.rows[0].skills) {
            responseSkills = String(result.rows[0].skills)
                .split(",")
                .map((skill) => skill.trim())
                .filter((skill) => skill.length > 0);
        }

        res.json({
            user_id: result.rows[0].user_id,
            email: result.rows[0].email,
            about: result.rows[0].about || "",
            skills: responseSkills
        });
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            console.error("PROFILE UPDATE TOKEN ERROR:", err);

            return res.status(401).json({
                message: "Login token is invalid or expired. Please log in again.",
                detail: err.message,
                errorName: err.name
            });
        }

        console.error("FULL PROFILE UPDATE ERROR:", err);

        res.status(500).json({
            message: "Server breakdown saving user profile elements.",
            detail: err.message,
            code: err.code,
            errorName: err.name
        });
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
const getEventWeather = async (req, res) => {
    const eventId = req.params.eventId;

    try {
        if (typeof fetch !== "function") {
            return res.status(500).json({
                message: "Weather lookup requires Node.js 18 or newer because it uses the built-in fetch API."
            });
        }

        const eventResult = await db.query(
            `SELECT event_id, title, location, TO_CHAR(date, 'YYYY-MM-DD') AS event_date
             FROM events
             WHERE event_id = $1`,
            [eventId]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        const event = eventResult.rows[0];

        if (!event.location || !event.event_date) {
            return res.status(400).json({
                message: "Event location or date is missing, so weather cannot be loaded."
            });
        }

        let place = null;

        const nominatimUrl =
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(event.location)}` +
            "&format=json&limit=1&addressdetails=1";

        const nominatimResponse = await fetch(nominatimUrl, {
            headers: {
                "User-Agent": "Staffly event weather lookup"
            }
        });

        const nominatimData = await nominatimResponse.json();

        if (
            nominatimResponse.ok &&
            Array.isArray(nominatimData) &&
            nominatimData.length > 0
        ) {
            const locationMatch = nominatimData[0];

            place = {
                name: locationMatch.display_name,
                country: locationMatch.address?.country,
                latitude: Number(locationMatch.lat),
                longitude: Number(locationMatch.lon),
                timezone: "auto",
                provider: "OpenStreetMap Nominatim"
            };
        }

        if (!place) {
            const geocodeUrl =
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(event.location)}` +
                "&count=1&language=en&format=json";

            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();

            if (
                geocodeResponse.ok &&
                geocodeData.results &&
                geocodeData.results.length > 0
            ) {
                const locationMatch = geocodeData.results[0];

                place = {
                    name: locationMatch.name,
                    country: locationMatch.country,
                    latitude: locationMatch.latitude,
                    longitude: locationMatch.longitude,
                    timezone: locationMatch.timezone || "auto",
                    provider: "Open-Meteo Geocoding"
                };
            }
        }

        if (!place) {
            return res.status(404).json({
                message: "Weather location could not be found. Try a format like 'Khalda, Amman, Jordan'.",
                location: event.location
            });
        }

        const timezone = place.timezone || "auto";

        const forecastUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
            "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max" +
            `&timezone=${encodeURIComponent(timezone)}`;

        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok || !forecastData.daily) {
            return res.status(502).json({
                message: "Weather forecast could not be loaded.",
                weatherApiResponse: forecastData
            });
        }

        const dayIndex = forecastData.daily.time.findIndex(
            (date) => date === event.event_date
        );

        if (dayIndex === -1) {
            return res.status(404).json({
                message: "Weather forecast is only available for nearby upcoming dates.",
                eventDate: event.event_date,
                availableDates: forecastData.daily.time
            });
        }

        res.json({
            event: {
                event_id: event.event_id,
                title: event.title,
                location: event.location,
                date: event.event_date
            },
            resolvedLocation: {
                name: place.name,
                country: place.country,
                latitude: place.latitude,
                longitude: place.longitude,
                timezone,
                provider: place.provider
            },
            units: {
                maxTemp: forecastData.daily_units?.temperature_2m_max,
                minTemp: forecastData.daily_units?.temperature_2m_min,
                rainChance: forecastData.daily_units?.precipitation_probability_max,
                windSpeed: forecastData.daily_units?.wind_speed_10m_max,
                weatherCode: forecastData.daily_units?.weather_code
            },
            weather: {
                date: forecastData.daily.time[dayIndex],
                maxTemp: forecastData.daily.temperature_2m_max?.[dayIndex],
                minTemp: forecastData.daily.temperature_2m_min?.[dayIndex],
                rainChance: forecastData.daily.precipitation_probability_max?.[dayIndex],
                windSpeed: forecastData.daily.wind_speed_10m_max?.[dayIndex],
                weatherCode: forecastData.daily.weather_code?.[dayIndex]
            },
            source: "Open-Meteo"
        });
    } catch (err) {
        console.error("Event weather lookup failed:", err);

        res.status(500).json({
            message: "Server error loading event weather.",
            detail: err.message
        });
    }
};


module.exports = {
    getExploreEvents,
    registerForEvent,
    getMyEvents,
    getProfile,
    updateProfile,
    submitFeedback,
    getEventById,
    getEventWeather
};