const { Pool } = require("pg");
require("dotenv").config();

// Create a new connection pool using your environmental variables
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

// Test the connection automatically when the app starts
pool.connect((err, client, release) => {
    if (err) {
        return console.error("❌ Database connection failed:", err.stack);
    }
    console.log("🚀 Connected to PostgreSQL (Staffly-Database) successfully!");
    release(); // Release the client back to the pool
});

// Export the query method to use across your controllers
module.exports = {
    query: (text, params) => pool.query(text, params),
};