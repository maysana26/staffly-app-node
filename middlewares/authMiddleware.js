// Middleware to verify if a user-role header indicates Admin access
const isAdmin = (req, res, next) => {
    const userRole = req.headers['user-role'];

    if (userRole === 'admin') {
        next(); // Authorized! Pass the request along to the controller execution flow
    } else {
        res.status(403).json({ message: "Access Denied: Admins privileges required." });
    }
};

module.exports = {
    isAdmin
};