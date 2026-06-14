let mockProfile = {
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    rating: "4.8",
    totalEvents: 24,
    memberSince: "Jan 2024",
    about: "Experienced event staff with a passion for creating memorable experiences. Specialized in registration management and customer service.",
    skills: ["Event Coordination", "Customer Service", "Registration Management", "Problem Solving"]
};

let mockRegisteredEvents = [
    { id: 1, title: "Tech Innovation Summit 2026", role: "Registration Desk Staff", location: "Convention Center, Downtown", date: "May 15, 2026", time: "08:00 AM - 05:00 PM", status: "Confirmed", category: "Technology" },
    { id: 2, title: "Art Gallery Opening", role: "Reception Staff", location: "Modern Art Museum", date: "May 8, 2026", time: "05:00 PM - 09:00 PM", status: "Confirmed", category: "Arts" }
];

let mockFeedbackSubmissions = [];

const getExploreEvents = (req, res) => {
    res.json([
        { id: 1, title: "Tech Innovation Summit 2026", location: "Convention Center, Downtown", date: "May 15, 2026" },
        { id: 3, title: "Spring Music Festival", location: "Outdoor Amphitheater", date: "March 15, 2026" }
    ]);
};

const registerForEvent = (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const newRegistration = {
        id: mockRegisteredEvents.length + 1,
        title: req.body.title || "Custom Event Assignment",
        role: req.body.role || "General Volunteer",
        location: req.body.location || "Assigned Location",
        date: req.body.date || "TBD",
        time: "Flexible Shifts",
        status: "Pending",
        category: req.body.category || "General"
    };
    mockRegisteredEvents.push(newRegistration);
    res.status(201).json({ message: "Application submitted successfully!", registration: newRegistration });
};

const getMyEvents = (req, res) => {
    res.json(mockRegisteredEvents);
};

const getProfile = (req, res) => {
    res.json(mockProfile);
};

const submitFeedback = (req, res) => {
    const newFeedback = {
        id: mockFeedbackSubmissions.length + 1,
        rating_score: req.body.rating_score,
        experience_comment: req.body.experience_comment,
        submitted_at: new Date()
    };
    mockFeedbackSubmissions.push(newFeedback);
    res.status(201).json({ message: "Feedback captured successfully.", data: newFeedback });
};

module.exports = {
    getExploreEvents,
    registerForEvent,
    getMyEvents,
    getProfile,
    submitFeedback
};