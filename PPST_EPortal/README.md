# PPST E-Portal — Universiti Malaysia Sabah
### Pusat Persediaan Sains dan Teknologi | Full-Stack Digital Forms System

---

## Project Status

| Step | Module | Status |
|------|--------|--------|
| ✅ Step 1 | Backend Auth (`server.js`, JWT, `/api/auth/login`) | **Done** |
| ✅ Step 2 | Student Module (Dashboard, 6 Forms, Tracker) | **Done** |
| 🔲 Step 3 | Admin Module (Review, Analytics, PDF Generation) | Pending |
| 🔲 Step 4 | Lecturer Module (Attendance, Class Roster) | Pending |
| 🔲 Step 5 | Pengarah Module (Digital Signature Approval) | Pending |

---

## Quick Start

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env        # Fill in your DB credentials + JWT secret

# Frontend
cd ../frontend
npm install
cp .env.example .env        # Set VITE_API_URL if needed
```

### 2. Database Setup

```sql
-- Run in MySQL (database already exists per your schema)
USE ppst_eportal;
-- Your tables are already created. Seed test users:
```

```bash
cd backend
node scripts/seed.js
```

**Test credentials after seeding:**

| Role      | ID           | Password      |
|-----------|--------------|---------------|
| Student   | BS2024001    | student123    |
| Admin     | ADMIN001     | admin123      |
| Lecturer  | LEC001       | lecturer123   |
| Pengarah  | PEN001       | pengarah123   |

### 3. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open: http://localhost:5173

---

## Folder Structure

```
ppst-eportal/
├── backend/
│   ├── config/
│   │   └── db.js                   ← MySQL connection pool
│   ├── middleware/
│   │   ├── authMiddleware.js        ← JWT protect + authorizeRoles
│   │   └── uploadMiddleware.js      ← Multer file upload (PDF/JPG/PNG)
│   ├── routes/
│   │   ├── authRoutes.js            ← POST /api/auth/login, GET /api/auth/me
│   │   ├── studentRoutes.js         ← GET /api/student/dashboard, /applications
│   │   └── formRoutes.js            ← POST /api/forms/submit/:type (all 6 forms)
│   ├── scripts/
│   │   └── seed.js                  ← Create test users for all 4 roles
│   ├── uploads/                     ← File storage (gitignored)
│   ├── server.js                    ← Express entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx       ← Global auth state (useAuth hook)
    │   ├── services/
    │   │   └── api.js                ← Axios instance + auto JWT injection
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx    ← RBAC route guard
    │   │   ├── Sidebar.jsx           ← Role-aware navigation sidebar
    │   │   └── StatusBadge.jsx       ← Application status badge component
    │   ├── forms/
    │   │   ├── FormWrapper.jsx       ← Shared form chrome + field components
    │   │   ├── SickLeaveForm.jsx     ← PPST/AKD-06
    │   │   └── OtherForms.jsx        ← AKD-07, AKD-03, AKD-01, AKD-02, AKD-05
    │   ├── modules/
    │   │   ├── student/
    │   │   │   ├── StudentLayout.jsx   ← Sidebar + <Outlet> wrapper
    │   │   │   ├── StudentDashboard.jsx← Stats + form cards + recent activity
    │   │   │   ├── ApplyForm.jsx       ← Form selector / form router
    │   │   │   └── ApplicationTracker.jsx ← List + detail views
    │   │   ├── admin/              ← (Step 3)
    │   │   ├── lecturer/           ← (Step 4)
    │   │   └── pengarah/           ← (Step 5)
    │   ├── pages/
    │   │   ├── Login.jsx + Login.css
    │   │   └── dashboards/         ← Role placeholder dashboards
    │   ├── App.jsx                  ← Root router
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## API Reference

### Auth
| Method | Endpoint         | Auth | Description               |
|--------|-----------------|------|---------------------------|
| POST   | /api/auth/login | ❌   | Login → returns JWT       |
| GET    | /api/auth/me    | ✅   | Validate token + get user |

### Student
| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| GET    | /api/student/dashboard          | ✅   | Stats + recent activity  |
| GET    | /api/student/applications       | ✅   | All applications (paginated) |
| GET    | /api/student/applications/:id   | ✅   | Single application detail |

### Forms (Student only)
| Method | Endpoint                             | Body            |
|--------|--------------------------------------|-----------------|
| POST   | /api/forms/submit/sick_leave         | multipart/form-data |
| POST   | /api/forms/submit/non_sick_leave     | multipart/form-data |
| POST   | /api/forms/submit/appeal_review      | multipart/form-data |
| POST   | /api/forms/submit/withdrawal         | multipart/form-data |
| POST   | /api/forms/submit/exam_replacement   | multipart/form-data |
| POST   | /api/forms/submit/room_booking       | application/json |
| DELETE | /api/forms/:id                       | — (withdraw pending) |

---

## Frontend Routes

| Path                        | Component            | Role     |
|-----------------------------|----------------------|----------|
| `/login`                    | Login                | Public   |
| `/student`                  | StudentDashboard     | student  |
| `/student/apply`            | ApplyForm (selector) | student  |
| `/student/apply/:form_type` | ApplyForm (specific) | student  |
| `/student/track`            | ApplicationList      | student  |
| `/student/track/:id`        | ApplicationDetail    | student  |
| `/admin`                    | AdminDashboard*      | admin    |
| `/lecturer`                 | LecturerDashboard*   | lecturer |
| `/pengarah`                 | PengarahDashboard*   | pengarah |

*Placeholder — full implementation in Steps 3–5.

---

## Security Highlights

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT signed with `HS256`, expires in 8h
- **Role-based access control** on every protected route (both API + frontend)
- **Helmet** sets secure HTTP headers
- **Rate limiting**: 20 login attempts / 15 min per IP
- File uploads restricted to PDF, JPG, PNG — max 10 MB
- Students can only read/delete their **own** applications (enforced at DB query level)

---

## Next Steps (Step 3 — Admin Module)

The following will be built next:

1. `GET /api/admin/applications` — paginated list with filters (form_type, status, course)
2. `PATCH /api/admin/applications/:id/approve` — move to `pending_pengarah`
3. `PATCH /api/admin/applications/:id/reject`  — move to `rejected`
4. `GET /api/admin/analytics` — aggregate counts by form_type and status
5. React `AdminDashboard`, `AdminApplicationList`, `AdminReviewModal`
6. PDF generation using `pdf-lib` to populate official PPST forms
