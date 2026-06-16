const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});

pool.connect()
    .then((client) => {
        console.log("Connected to PostgreSQL (Staffly database) successfully.");
        client.release();
    })
    .catch((err) => {
        console.error("Database connection failed:", err.stack);
    });

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool,
};

