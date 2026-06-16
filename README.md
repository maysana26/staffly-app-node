# Staffly API – Backend Engine 🚀

Staffly is a specialized full-stack event staffing web application designed to bridge the operational gap between event management planners (**Admins**) and casual, shift-based workers (**Applicants**).

Unlike traditional job boards, Staffly treats event posts as dynamic containers for specific operational roles with strict numerical capacity limits and automated business rules.

---

# 🛠️ Tech Stack

* **Runtime Environment:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL
* **Database Driver:** pg (Connection Pooling)
* **Authentication:** JWT-Based Authentication
* **API Style:** RESTful Architecture

---

# ⚙️ Core Architectural Features

### 1. Dynamic Capacity Management

Role-specific staffing requirements are automatically tracked through database counters. Applications are only accepted while capacity remains available.

### 2. Event Registration Infrastructure

Applicants can register for available event roles while the system prevents duplicate registrations and overbooking.

### 3. Administrative Event Management

Administrators can create, edit, delete, and monitor events through protected API endpoints.

### 4. Applicant Profile Management

Applicants can maintain profile information, skills, and personal details through dedicated profile endpoints.

### 5. Real-Time Weather Integration

Event-specific weather information can be retrieved dynamically to provide additional context for applicants before registration.

### 6. Application Tracking System

Applicants and administrators can monitor application statuses and staffing progress throughout the event lifecycle.

---

# 🚀 Local Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/maysana26/staffly-app-node.git
cd staffly-app-node
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=staffly
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your_secret_key
```

### 4. Start the Server

```bash
node server.js
```

The backend server should now be running locally and ready to process API requests.

---

# 🧭 API Reference

## 🔐 Authentication Module

### POST /api/applicant/signup

Creates a new user account and stores user information in the database.

**Request Type:** POST

**Purpose:**

* Register new Applicants
* Register new Admins

---

### POST /api/applicant/login

Authenticates user credentials and grants access to the platform.

**Request Type:** POST

**Purpose:**

* User authentication
* JWT token generation

---

# 🏃 Applicant Module

## GET /api/applicant/explore-events

Returns all available events and staffing opportunities visible to applicants.

**Request Type:** GET

---

## GET /api/applicant/events/:eventId

Retrieves detailed information for a specific event.

**Request Type:** GET

---

## GET /api/applicant/events/:eventId/weather

Returns weather information associated with a selected event.

**Request Type:** GET

---

## POST /api/applicant/register

Registers an applicant for a selected event role.

**Request Type:** POST

**Business Rules:**

* Prevent duplicate registrations
* Validate role capacity
* Update staffing counters

---

## GET /api/applicant/myevents

Returns all event applications associated with the authenticated applicant.

**Request Type:** GET

---

## DELETE /api/applicant/my-applications/:id

Removes a submitted application from the system.

**Request Type:** DELETE

**Purpose:**

* Application withdrawal
* Database record removal

---

## GET /api/applicant/profile

Retrieves applicant profile information.

**Request Type:** GET

---

## PUT /api/applicant/profile/update

Updates applicant profile information.

**Request Type:** PUT

---

## POST /api/applicant/feedback

Stores feedback, ratings, and evaluation information.

**Request Type:** POST

---

# 💼 Admin Module

> All admin endpoints require administrative authorization middleware.

---

## GET /api/admin/dashboard-stats

Returns dashboard statistics and platform analytics.

**Request Type:** GET

---

## GET /api/admin/summary

Alternative dashboard analytics endpoint.

**Request Type:** GET

---

## GET /api/admin/events

Retrieves all events managed within the system.

**Request Type:** GET

---

## POST /api/admin/events

Creates a new event.

**Request Type:** POST

---

## POST /api/admin/create-event

Alternative event creation endpoint.

**Request Type:** POST

---

## PUT /api/admin/events/:id

Updates an existing event.

**Request Type:** PUT

---

## PUT /api/admin/edit-event/:id

Alternative event update endpoint.

**Request Type:** PUT

---

## DELETE /api/admin/events/:id

Deletes an event from the system.

**Request Type:** DELETE

---

## GET /api/admin/events/:id/details

Returns detailed event information including staffing statistics and registration data.

**Request Type:** GET

---

## GET /api/admin/applications

Retrieves all submitted applications.

**Request Type:** GET

---

## PUT /api/admin/applications/:id/status

Updates application approval status.

**Request Type:** PUT

**Possible Status Values:**

* Pending
* Approved
* Rejected

---

# 📌 Business Rules

### Capacity Enforcement

Applicants cannot register for roles that have already reached their staffing limit.

### Duplicate Registration Prevention

An applicant cannot register more than once for the same role.

### Protected Administrative Access

Administrative functionality is protected using middleware authorization checks.

### Dynamic Staffing Updates

Role capacity counters are automatically updated whenever registrations occur.

### Data Integrity Protection

Database transactions ensure consistency when creating applications and updating staffing counts.

---

# 👥 User Roles

## Admin

* Create events
* Edit events
* Delete events
* Review applications
* Update application statuses
* Access dashboard analytics
* Monitor staffing requirements

---

## Applicant

* Create accounts
* Browse events
* Register for event roles
* View registered events
* Update profile information
* Submit and receive feedback
* Withdraw applications

---

# 📄 License

This project was developed for educational and academic purposes.
