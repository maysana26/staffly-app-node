# Staffly API – Backend Engine 🚀

Staffly is a specialized full-stack event staffing web application designed to bridge the operational gap between event management planners (**Admins**) and casual, shift-based workers (**Applicants**).

Unlike traditional job boards, Staffly treats event posts as dynamic containers for specific operational roles with strict numerical capacity limits and automated business rules.

---

# 🛠️ Tech Stack

* **Runtime Environment:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL (Relational Database)
* **Database Driver:** pg (Connection Pooling)

---

# ⚙️ Core Architectural Features

### **1. Dynamic Capacity Logic**

Event containers manage role-specific staffing demands, ensuring that each role is filled only up to its required capacity (e.g., exactly 3 cleaners, 2 lighting managers, etc.).

### **2. 48-Hour Lock-In Enforcement**

Database-level date calculations automatically prevent applicants from canceling registered shifts when the event start time is less than 48 hours away.

### **3. Administrative Evaluation Infrastructure**

Built-in functionality allows administrators to record post-event performance evaluations, including:

* Star ratings (out of 5)
* Performance feedback comments
* Point and ranking updates

---

# 🚀 Local Installation & Setup

### **1. Clone the Repository**

```bash
git clone https://github.com/maysana26/staffly-app-node.git
cd staffly-app-node
```

### **2. Install Project Dependencies**

```bash
npm install
```

### **3. Configure Environment Variables**

Create a `.env` file in the project root directory.

Use the configuration keys provided in `.env.example` and supply the appropriate values for your environment.

### **4. Start the Server**

```bash
node server.js
```

The backend server should now be running locally and ready to accept API requests.

---

# 🧭 API Reference

## 🔐 Authentication Module

### **POST /api/applicant/signup**

Registers a new user account (Admin or Applicant) and stores it permanently in the database.

### **POST /api/applicant/login**

Authenticates user credentials and returns the appropriate access response.

---

## 💼 Admin Management Module

**Requires:** `user-role: admin` request header

### **GET /api/admin/dashboard-stats**

Retrieves dashboard analytics, workspace statistics, and recent activity summaries.

### **GET /api/admin/events**

Returns a list of all created event containers.

### **POST /api/admin/create-event**

Creates a new event and its associated operational requirements.

### **PUT /api/admin/edit-event/:id**

Updates event details and logistics using contextual fallback values where necessary.

### **GET /api/admin/applications**

Retrieves all submitted applicant registrations across managed events.

---

## 🏃 Applicant Module

### **GET /api/applicant/explore-events**

Returns a public feed of upcoming events and available staffing roles with vacancy validation.

### **POST /api/applicant/register**

Submits an application for a selected role while preventing duplicate registrations.

### **GET /api/applicant/myevents**

Returns all registered shifts for the authenticated applicant, including real-time cancellation eligibility (`canCancel`).

### **GET /api/applicant/profile**

Retrieves applicant profile information, skills, accumulated points, rankings, and performance history.

### **POST /api/applicant/feedback**

Stores administrator-generated performance ratings and review comments for applicants.

---

# 📌 Business Rules

### **Capacity Enforcement**

Applicants cannot register for roles that have already reached their maximum staffing capacity.

### **Duplicate Registration Protection**

Applicants cannot register multiple times for the same role within the same event.

### **48-Hour Cancellation Restriction**

Applicants are prevented from canceling a shift if the event begins within 48 hours.

### **Performance Tracking**

Administrators can evaluate applicants after event completion using ratings, comments, and point-based assessments.

---

# 👥 User Roles

## **Admin**

* Create and manage events
* Monitor applications
* Review staffing requirements
* Evaluate applicant performance
* Access administrative analytics

## **Applicant**

* Explore available events
* Register for staffing roles
* View registered shifts
* Manage profile information
* Receive ratings and feedback

---

# 📄 License

This project is intended for educational and academic purposes.
