const db = require("../config/db"); // Import our database connection pool

// 1. SIGNUP CONTROLLER
const signup = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Check if the user already exists in the database
        const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: "User account with this email already exists" });
        }

        // Insert the new user into the database
        const newUserQuery = `
            INSERT INTO users (name, email, password, role) 
            VALUES ($1, $2, $3, $4) 
            RETURNING user_id, name, email, role
        `;
        const values = [name, email, password, role || "applicant"];
        const result = await db.query(newUserQuery, values);

        res.status(201).json({
            message: "Account created successfully in database!",
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error during registration" });
    }
};

// 2. LOGIN CONTROLLER
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Query the database for the user matching the email and password
        const result = await db.query(
            "SELECT user_id, name, email, role FROM users WHERE email = $1 AND password = $2",
            [email, password]
        );

        if (result.rows.length > 0) {
            res.json({
                message: "Login successful from database!",
                user: result.rows[0]
            });
        } else {
            res.status(401).json({ message: "Invalid email or password credentials" });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error during login" });
    }
};

module.exports = {
    login,
    signup
};