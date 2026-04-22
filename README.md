# FaceAttend 👁 — Intelligent Attendance System

AI-powered face recognition attendance system with role-based access control, built on Node.js + Express + MySQL + Sequelize + face-api.js.

---

## 🏗 Architecture

```
faceattend/
├── backend/
│   ├── src/
│   │   ├── config/         # Sequelize DB config
│   │   ├── controllers/    # Route handlers (auth, users, students, classes, attendance, dashboard)
│   │   ├── middleware/     # JWT auth, role authorization, file upload
│   │   ├── models/         # Sequelize models (User, Student, Class, AttendanceSession, AttendanceRecord)
│   │   ├── routes/         # Express routers
│   │   ├── utils/          # DB seed script
│   │   └── server.js       # Entry point
│   ├── uploads/faces/      # Uploaded images (not used for recognition — descriptors in DB)
│   ├── .env.example        # Environment config template
│   └── package.json
└── frontend/
    └── public/
        ├── index.html      # Login page
        └── app.html        # Main SPA (served after auth)
```

---

## 🚀 Setup

### 1. MySQL Database
```sql
CREATE DATABASE faceattend CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
npm run seed     # Creates tables + demo users
npm start        # or: npm run dev  (hot-reload)
```

### 3. Open in Browser
```
http://localhost:3000
```
The frontend is served directly by Express (no separate server needed).

---

## 👥 Roles & Permissions

| Feature                     | Admin | Teacher | Student |
|-----------------------------|-------|---------|---------|
| View dashboard stats         | ✅    | ✅ (own) | ❌      |
| Open/close sessions          | ✅    | ✅ (own) | ❌      |
| Run face recognition scan    | ✅    | ✅      | ❌      |
| Enroll student faces         | ✅    | ✅      | ❌      |
| Create/delete students       | ✅    | Create  | ❌      |
| Create classes               | ✅    | ✅      | ❌      |
| Delete classes               | ✅    | ❌      | ❌      |
| Manage users (CRUD)          | ✅    | ❌      | ❌      |
| Export CSV                   | ✅    | ✅      | ❌      |

---

## 🔑 Demo Credentials (after seed)

| Role    | Email                        | Password      |
|---------|------------------------------|---------------|
| Admin   | admin@faceattend.tz          | Admin@1234    |
| Teacher | kaunda@faceattend.tz         | Teacher@1234  |
| Teacher | nyerere@faceattend.tz        | Teacher@1234  |

---

## 🔌 REST API Reference

### Auth
| Method | Route                  | Auth | Description         |
|--------|------------------------|------|---------------------|
| POST   | /api/auth/login        | ❌   | Login, get JWT      |
| GET    | /api/auth/me           | ✅   | Current user        |
| POST   | /api/auth/change-password | ✅ | Change password    |

### Users (Admin only)
| Method | Route            | Description          |
|--------|------------------|----------------------|
| GET    | /api/users       | List all users       |
| POST   | /api/users       | Create user          |
| PUT    | /api/users/:id   | Update user          |
| DELETE | /api/users/:id   | Delete user          |

### Students
| Method | Route                      | Auth     | Description            |
|--------|----------------------------|----------|------------------------|
| GET    | /api/students              | A/T      | List all               |
| GET    | /api/students/:id          | A/T      | Get student + history  |
| POST   | /api/students              | A/T      | Create student         |
| PUT    | /api/students/:id          | A/T      | Update student         |
| DELETE | /api/students/:id          | Admin    | Delete student         |
| POST   | /api/students/:id/face     | A/T      | Enroll face descriptors|
| DELETE | /api/students/:id/face     | Admin    | Remove face data       |
| GET    | /api/students/descriptors  | A/T      | All enrolled descriptors (for face-api matcher) |

### Classes
| Method | Route                              | Auth  | Description            |
|--------|------------------------------------|-------|------------------------|
| GET    | /api/classes                       | A/T   | List classes           |
| POST   | /api/classes                       | A/T   | Create class           |
| PUT    | /api/classes/:id                   | A/T   | Update class           |
| DELETE | /api/classes/:id                   | Admin | Delete class           |
| POST   | /api/classes/:id/students          | A/T   | Enroll students        |
| DELETE | /api/classes/:id/students/:sid     | A/T   | Remove from class      |

### Attendance
| Method | Route                         | Auth | Description              |
|--------|-------------------------------|------|--------------------------|
| POST   | /api/attendance/sessions      | A/T  | Open session             |
| GET    | /api/attendance/sessions      | A/T  | List sessions            |
| GET    | /api/attendance/sessions/:id  | A/T  | Session detail           |
| PATCH  | /api/attendance/sessions/:id/close | A/T | Close session       |
| POST   | /api/attendance/mark          | A/T  | Mark single attendance   |
| POST   | /api/attendance/bulk          | A/T  | Bulk mark                |
| GET    | /api/attendance/today         | A/T  | Today's stats            |
| GET    | /api/attendance/report        | A/T  | Filter report (date range, class, student) |

### Dashboard
| Method | Route                  | Auth    | Description       |
|--------|------------------------|---------|-------------------|
| GET    | /api/dashboard/admin   | Admin   | Admin KPI stats   |
| GET    | /api/dashboard/teacher | A/T     | Teacher stats     |

---

## 🤖 How Face Recognition Works

1. **Enroll**: Teacher/admin selects a student, turns on camera, captures 3 samples.  
   Each sample is processed by face-api.js in the browser to extract a 128-dimension face descriptor.  
   Descriptors are POSTed to `POST /api/students/:id/face` and stored as JSON in MySQL.

2. **Recognize**: On the Scan page, select an open session.  
   When "Recognize" is clicked (or Auto mode is on), face-api.js detects all faces in the video feed,  
   computes their descriptor, then loads all enrolled descriptors from `/api/students/descriptors`  
   and uses `FaceMatcher` to find the closest match (threshold: 55% confidence).

3. **Mark**: If a match is found above the threshold, `POST /api/attendance/mark` is called with  
   `session_id`, `student_id`, `status` (present/late based on time vs session threshold), and `confidence`.

---

## 📦 Key Dependencies

| Package      | Purpose                          |
|--------------|----------------------------------|
| express      | HTTP server & routing            |
| sequelize    | ORM for MySQL                    |
| mysql2       | MySQL driver                     |
| jsonwebtoken | JWT auth tokens                  |
| bcryptjs     | Password hashing                 |
| helmet       | HTTP security headers            |
| cors         | Cross-Origin Resource Sharing    |
| face-api.js  | Browser-side face recognition    |

---

## 🔒 Security Notes
- JWT secret **must** be changed in production (`JWT_SECRET` in `.env`)
- Rate limiting applied to login (20 req/15min) and API (300 req/min)
- Passwords hashed with bcrypt (12 rounds)
- Face descriptors stored as JSON, never the raw images
