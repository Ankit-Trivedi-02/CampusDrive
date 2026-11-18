# Campus Recruitment Management Portal – MVP

A full-stack, role-based university placement management portal built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB**, **Mongoose**, **JWT**, and **bcrypt**.

Inspired by Linear, Vercel Dashboard, and modern enterprise SaaS design systems.

---

## 🚀 Live Services & Architecture

| Component | Technology | Default URL / Port |
| :--- | :--- | :--- |
| **Frontend Client** | React 19, Vite, TypeScript, Tailwind CSS, Lucide | `http://localhost:5173` |
| **Backend API** | Node.js, Express.js, TypeScript, Mongoose | `http://localhost:5000` |
| **Database** | MongoDB Server (Local or Atlas) | `mongodb://127.0.0.1:27017/campus_recruitment` |

---

## 👥 User Roles & Demo Credentials

The database comes pre-seeded with initial accounts for all four roles:

| Role | Username / Identifier | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@placement.edu` (or `9999999999`) | `AdminPassword123!` | Complete control: Companies, HRs, Coordinators, Students, Master Applications, CSV Reports, Live Audit Trail |
| **COORDINATOR** | `coordinator@placement.edu` (or `9888888888`) | `Coordinator123!` | Onboard students, assign students to company drives, prevent duplicate applications |
| **HR / COMPANY** | `hr@infosys.com` (or `9777777777`) | `HrPassword123!` | Manage candidate pipelines for assigned companies, advance statuses, schedule interviews, record CTC packages |
| **STUDENT** | `aarav.patel@student.edu` (or `9111111111`) | `Student123!` | Read-only dossier: view profile, track application stages, interview dates, CTC offers, and upcoming drives |

> 💡 **Autofill Chips**: The login page includes one-click demo login chips for instant testing.

---

## 🛠️ Complete 13-Step Acceptance Workflow Verification

This portal has been tested and verified to fulfill the required end-to-end data flow:

1. **Admin logs in**: Sign in as `admin@placement.edu` &rarr; Redirects to `/admin/dashboard`.
2. **Admin creates company**: Go to *Companies* &rarr; Click **Add Company** &rarr; Enter name `TCS`, location, dates, status `ACTIVE`.
3. **Admin creates HR account**: Go to *HR Accounts* &rarr; Click **New HR Account** &rarr; Name `TCS HR Lead`, email `hr@tcs.com`, phone `9876543210`, assign to `TCS`.
4. **Admin creates coordinator**: Go to *Coordinators* &rarr; Click **New Coordinator** &rarr; Name `Dr. Vikram Malhotra`, email `vikram.coord@placement.edu`.
5. **Coordinator logs in**: Sign out & log in as `vikram.coord@placement.edu` / `CoordPassword123!` &rarr; Redirects to `/coordinator/dashboard`.
6. **Coordinator creates student**: Go to *Students* &rarr; Click **Enroll New Student** &rarr; Name `Kavya Sharma`, roll number `2023BTCS099`, email `kavya.sharma@student.edu`, BTECH CSE.
7. **Coordinator assigns student to TCS**: Go to *Make Application* &rarr; Select `Kavya Sharma`, select `TCS` &rarr; Click **Confirm & Register Application**.
8. **HR logs in**: Log in as `hr@tcs.com` &rarr; Redirects to `/hr/dashboard` (active company shows `TCS`).
9. **HR views applicant list**: Go to *Applicants* &rarr; Sees `Kavya Sharma` listed with status `APPLIED`.
10. **HR updates status**: Click **Change Status** &rarr; Select `SHORTLISTED` from dropdown.
11. **HR schedules interview & adds details**: Enter interview date, optional CTC package (e.g. `7.5 LPA`), enter remarks, toggle student visibility, and submit.
12. **Student logs in**: Log in as `kavya.sharma@student.edu` &rarr; Redirects to `/student/dashboard`.
13. **Student views applications**: Go to *My Applications* &rarr; Sees `TCS`, status badge `SHORTLISTED`, interview date, and visible remarks.

---

## 🔒 Security & Role-Based Permissions

- **Bcrypt Password Hashing**: Passwords are never stored in plaintext (salted and hashed with bcrypt).
- **JWT Authentication**: Secure Bearer tokens with 7-day expiration and automatic 401 interceptor redirection.
- **Strict Role-Based Routing**: Server middleware (`authorize`) and client (`ProtectedRoute`) block unauthorized access across all endpoints.
- **HR Company Verification**: On every applicant query and status update, the backend verifies that the requesting HR account is assigned to that company.
- **Confidentiality Enforcement**: Coordinators cannot modify selection statuses or inspect internal HR evaluation remarks.
- **Duplicate Prevention**: Unique MongoDB compound index on `{ studentId: 1, companyId: 1 }` prevents duplicate student-company applications.

---

## 📁 Project Structure

```text
CAMPUS_DRIVE/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Sidebar, Header, ProtectedRoute
│   │   │   └── ui/            # Modal, ConfirmationModal, StatCard, Toast, Pagination, Breadcrumbs
│   │   ├── context/           # AuthContext (login, logout, refresh)
│   │   ├── layouts/           # DashboardLayout
│   │   ├── pages/
│   │   │   ├── admin/         # Dashboard, Companies, Coordinators, HRs, Students, Applications
│   │   │   ├── coordinator/   # Dashboard, Students, Make Application, Applications
│   │   │   ├── hr/            # Dashboard, Applicants, Status Management Modal
│   │   │   ├── student/       # Dashboard, My Applications, Upcoming Companies
│   │   │   └── Login.tsx      # Unified Login with quick-autofill chips
│   │   ├── services/          # Axios instance with auth interceptor
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # Status formatters & badge styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── config/            # db.ts (Mongoose), seed.ts
│   │   ├── controllers/       # auth, admin, coordinator, hr, student
│   │   ├── middleware/        # authenticate, authorize, verifyHrCompanyOwnership, errorHandler
│   │   ├── models/            # User, Company, Application, ActivityLog
│   │   ├── routes/            # auth, admin, coordinator, hr, student routes
│   │   ├── utils/             # activityLogger
│   │   └── server.ts          # Express application entry point
│   ├── package.json
│   └── tsconfig.json
│
├── package.json               # Root scripts
└── README.md
```

---

## 📦 Setup & Installation Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node v22.20.0)
- **MongoDB**: Local MongoDB instance on port 27017 or MongoDB Atlas connection string

### 1. Backend Setup
```bash
cd server
npm install
npm run seed     # Seeds Admin & sample demo users into MongoDB
npm run dev      # Starts Express API server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev      # Starts Vite React dev server on http://localhost:5173
```

### 3. Environment Variables
`server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campus_recruitment
JWT_SECRET=super_secret_jwt_key_campus_portal_2026_change_in_production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```
