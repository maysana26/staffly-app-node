let mockEvents = [
    { id: 1, title: "Tech Innovation Summit 2026", location: "Convention Center, Downtown", date: "2026-05-15", category: "Technology", description: "A gathering of elite tech professionals." },
    { id: 2, title: "Art Gallery Opening", location: "Modern Art Museum", date: "2026-05-08", category: "Arts", description: "An evening viewing contemporary installations." }
];

let mockApplications = [
    { id: 1, applicantName: "Sarah Johnson", eventTitle: "Tech Innovation Summit 2026", role: "Registration Desk Staff", status: "Accepted" },
    { id: 2, applicantName: "Sarah Johnson", eventTitle: "Art Gallery Opening", role: "Reception Staff", status: "Pending" }
];

const getDashboardStats = (req, res) => {
    res.json({
        totalEventsCreated: mockEvents.length,
        totalIncomingApplications: mockApplications.length,
        recentApplications: mockApplications
    });
};

const getAdminEvents = (req, res) => {
    res.json(mockEvents);
};

const createEvent = (req, res) => {
    const newEvent = {
        id: mockEvents.length + 1,
        title: req.body.title,
        location: req.body.location,
        date: req.body.date,
        category: req.body.category || "General",
        description: req.body.description || ""
    };
    mockEvents.push(newEvent);
    res.status(201).json({ message: "Event created successfully!", event: newEvent });
};

const editEvent = (req, res) => {
    const eventId = parseInt(req.params.id);
    const event = mockEvents.find(e => e.id === eventId);

    if (event) {
        event.title = req.body.title || event.title;
        event.location = req.body.location || event.location;
        event.date = req.body.date || event.date;
        event.category = req.body.category || event.category;
        event.description = req.body.description || event.description;
        res.json({ message: "Event updated successfully", updatedEvent: event });
    } else {
        res.status(404).json({ message: "Target event not found" });
    }
};

const getApplications = (req, res) => {
    res.json(mockApplications);
};

module.exports = {
    getDashboardStats,
    getAdminEvents,
    createEvent,
    editEvent,
    getApplications
};