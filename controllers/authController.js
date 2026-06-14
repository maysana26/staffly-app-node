// Local temporary database array mock store
let mockUsers = [
    { email: "sarah.johnson@email.com", password: "password123", name: "Sarah Johnson", role: "applicant" }
];

const login = (req, res) => {
    const { email, password } = req.body;
    const user = mockUsers.find(u => u.email === email && u.password === password);

    if (user) {
        res.json({
            message: "Login successful",
            user: { name: user.name, email: user.email, role: user.role }
        });
    } else {
        res.status(401).json({ message: "Invalid email or password credentials" });
    }
};

const signup = (req, res) => {
    const { name, email, password, role } = req.body;

    if (mockUsers.some(u => u.email === email)) {
        return res.status(400).json({ message: "User account with this email already exists" });
    }

    const newUser = { name, email, password, role: role || "applicant" };
    mockUsers.push(newUser);
    res.status(201).json({ message: "Account created successfully!", user: { name, email, role: newUser.role } });
};

module.exports = {
    login,
    signup
};