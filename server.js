const express = require("express");
const cors = require("cors");

require("dotenv").config();
const db = require("./config/db.js");

// Import separate route modules
const adminRoutes = require("./routes/AdminRoutes");
const applicantRoutes = require("./routes/ApplicantRoutes");
const eventRoutes = require("./routes/EventRoutes");

const app = express();

// Middleware loaders
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Staffly Backend is running.");
});

// Mounting the specific role sub-route groupings
if (adminRoutes) app.use("/api/admin", adminRoutes);
app.use("/api/applicant", applicantRoutes);
app.use("/api/events", eventRoutes);

// Fallback Route for non-existent endpoint handles
app.use((req, res) => {
    res.status(404).json({ message: "Requested endpoint route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});