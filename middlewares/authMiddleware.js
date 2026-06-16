const jwt = require("jsonwebtoken");

const isAdmin = (req, res, next) => {
    const userRole = req.headers["user-role"];

    if (userRole === "admin") {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "fallback_secret_key_string"
            );

            if (decoded.role === "admin") {
                return next();
            }
        } catch (err) {
            return res.status(401).json({
                message: "Invalid or expired admin token."
            });
        }
    }

    res.status(403).json({
        message: "Access Denied: Admin privileges required."
    });
};

module.exports = {
    isAdmin
};