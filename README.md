# TNP Connect — Training & Placement Platform

> A full-stack campus recruitment platform that connects students with placement opportunities through a smart job board, document vault, and admin analytics dashboard.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![AWS](https://img.shields.io/badge/AWS-S3%20%2B%20CloudFront%20%2B%20EC2-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

## Live Demo

| Surface | URL |
|---------|-----|
| Frontend | [d3n0if71dkljcl.cloudfront.net](https://d3n0if71dkljcl.cloudfront.net) |
| Backend API | `https://d3n0if71dkljcl.cloudfront.net/api/v1` (via CloudFront proxy → EC2) |

---

## Screenshots

<table>
  <tr>
    <td align="center"><b>Landing Page</b></td>
    <td align="center"><b>Login</b></td>
  </tr>
  <tr>
    <td><img src="./stitch/landing_page/screen.png" alt="Landing Page" width="100%"/></td>
    <td><img src="./stitch/login/screen.png" alt="Login Page" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>Student Registration</b></td>
    <td align="center"><b>Student Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="./stitch/student_registration/screen.png" alt="Student Registration" width="100%"/></td>
    <td><img src="./stitch/student_dashboard/screen.png" alt="Student Dashboard" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>Job Board</b></td>
    <td align="center"><b>My Applications</b></td>
  </tr>
  <tr>
    <td><img src="./stitch/job_board/screen.png" alt="Job Board" width="100%"/></td>
    <td><img src="./stitch/my_applications/screen.png" alt="My Applications" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>Admin Dashboard</b></td>
    <td align="center"><b>Manage Jobs</b></td>
  </tr>
  <tr>
    <td><img src="./stitch/admin_dashboard/screen.png" alt="Admin Dashboard" width="100%"/></td>
    <td><img src="./stitch/manage_jobs_admin/screen.png" alt="Manage Jobs" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>Applicants Review</b></td>
    <td align="center"><b>Profile</b></td>
  </tr>
  <tr>
    <td><img src="./stitch/applicants_review_admin/screen.png" alt="Applicants Review" width="100%"/></td>
    <td><img src="./stitch/nexus_professional/screen.png" alt="Student Profile" width="100%"/></td>
  </tr>
</table>

---

## Features

### Student Portal
- **Smart Job Board** — View only jobs you're eligible for, filtered by CGPA, branch, and skills
- **One-Click Apply** — Immutable application snapshots captured at apply time (profile changes don't affect submitted apps)
- **Document Vault** — Upload and manage resumes and certificates with AWS S3 signed URLs
- **Application Tracker** — Real-time status updates (Applied → Shortlisted → Interviewed → Offered)
- **Notifications** — Deadline reminders and status change alerts

### Admin / Placement Cell
- **Post Jobs** — Create job listings with eligibility criteria (CGPA cutoff, branch restrictions, skills)
- **Applicants Review** — Browse and shortlist applicants, view frozen profile snapshots
- **Excel Export** — Download applicant data as a formatted `.xlsx` report per job
- **Placement Analytics** — Charts for placement rates, package distributions, branch-wise stats
- **Deadline Management** — Open/close applications, automated reminders via cron jobs

### Platform
- **JWT Auth** — Access tokens (2h) + refresh tokens (7d) with secure rotation
- **RBAC** — Student and Admin roles with protected routes on both frontend and backend
- **Framer Motion** — Smooth page transitions, stagger animations, and interactive micro-interactions
- **Responsive Shell** — Fixed app shell with no page-level scroll; fit-to-screen layout

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, React Router v6 |
| **State / Data** | Zustand, TanStack React Query v5 |
| **UI / Styling** | Tailwind CSS (Material Design 3 tokens), Lucide icons |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL 15 (via `pg` pool) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **File Storage** | AWS S3 + pre-signed GET URLs |
| **Email** | Nodemailer (SMTP / AWS SES) |
| **Scheduled Jobs** | node-cron |
| **Excel Export** | ExcelJS |
| **Validation** | Joi |
| **Infra** | AWS EC2 (backend), AWS S3 + CloudFront (frontend) |

---

## Architecture

```
Browser (HTTPS)
      │
      ▼
┌─────────────────────────────┐
│  AWS CloudFront CDN         │
│  d3n0if71dkljcl.cloudfront  │
│                             │
│  /*      → S3 Bucket        │  ← React SPA (Vite build)
│  /api/*  → EC2 Origin       │  ← Express API (port 80)
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│  AWS EC2 (Node.js / Express)│
│                             │
│  /api/v1/auth/*             │
│  /api/v1/students/*         │
│  /api/v1/jobs/*             │
│  /api/v1/applications/*     │
│  /api/v1/documents/*        │
│  /api/v1/admin/*            │
│  /api/v1/notifications/*    │
└──────────────┬──────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
PostgreSQL 15          AWS S3
(Users, Jobs,       (Resumes &
 Applications,       Documents)
 Documents,
 Notifications)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- AWS account (S3 bucket + SES, optional for local dev)

### 1. Clone

```bash
git clone https://github.com/your-username/tnp-connect.git
cd tnp-connect
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your DB credentials, JWT secrets, and AWS keys in .env
```

Run database migrations and seed demo data:

```bash
npm run migrate   # Creates all tables
npm run seed      # Seeds demo users, jobs, and applications
```

Start the backend:

```bash
npm run dev       # Development (hot reload via --watch)
npm start         # Production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:5000/api/v1 for local dev
npm run dev
```

### 4. Open

```
Frontend: http://localhost:5173
Backend:  http://localhost:5000/api/v1
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5000

# Frontend origin for CORS
FRONTEND_URL=https://your-cloudfront-domain.cloudfront.net

# JWT
JWT_SECRET=your-long-random-secret
JWT_REFRESH_SECRET=your-long-random-refresh-secret

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tnp_platform
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_SSL=false

# AWS S3 (document storage)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=tnp-platform

# Email (AWS SES or SMTP)
SES_FROM_EMAIL=noreply@yourdomain.com

# Cron
DISABLE_CRON=false
```

### Frontend (`frontend/.env`)

```env
# Local dev
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Frontend (`frontend/.env.production`)

```env
# Production — route through CloudFront to avoid mixed content
VITE_API_BASE_URL=https://your-cloudfront-domain.cloudfront.net/api/v1
```

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Student registration |
| `POST` | `/auth/login` | Public | Login, returns JWT pair |
| `POST` | `/auth/refresh` | Public | Refresh access token |
| `POST` | `/auth/logout` | Public | Revoke refresh token |
| `GET` | `/students/me/dashboard` | Student | Dashboard stats + active jobs |
| `GET/PUT` | `/students/me/profile` | Student | View/update profile |
| `GET` | `/jobs` | Student | Eligible jobs (criteria matched) |
| `GET` | `/jobs/:id` | Student | Job detail |
| `POST` | `/applications/:jobId` | Student | Apply (creates snapshot) |
| `GET` | `/applications/my` | Student | My applications |
| `POST` | `/documents/upload` | Student | Upload to S3 |
| `GET` | `/documents` | Student | List my documents |
| `GET` | `/notifications` | Student | Notification feed |
| `POST` | `/admin/jobs` | Admin | Post a new job |
| `PUT` | `/admin/jobs/:id` | Admin | Edit job |
| `DELETE` | `/admin/jobs/:id` | Admin | Delete job |
| `GET` | `/admin/jobs/:id/applicants` | Admin | View applicants |
| `GET` | `/admin/jobs/:id/export` | Admin | Download Excel |
| `PATCH` | `/admin/applications/:id/status` | Admin | Update application status |
| `GET` | `/admin/analytics` | Admin | Placement analytics |

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full AWS deployment instructions covering:
- Building the React app and uploading to S3
- Configuring CloudFront (SPA routing + `/api/*` proxy behavior)
- Running the backend on EC2 with PM2
- Setting up PostgreSQL on EC2 or RDS
- Configuring CORS and environment variables

---

## Project Structure

```
tnp-connect/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/          # Login, Register
│   │   │   ├── student/       # Dashboard, JobBoard, Applications, Profile, Documents
│   │   │   └── admin/         # Dashboard, PostJob, ManageJobs, Applicants, Analytics
│   │   ├── components/        # JobCard, ShellSidebar, NotificationBell, ...
│   │   ├── layouts/           # StudentLayout, AdminLayout (page transitions)
│   │   ├── store/             # Zustand auth store
│   │   └── lib/               # apiClient (axios + interceptors)
│   └── .env.production
│
├── backend/
│   ├── src/
│   │   ├── controllers/       # auth, student, job, application, document, admin, notification
│   │   ├── routes/            # Express routers
│   │   ├── middleware/        # JWT auth, RBAC, upload (multer)
│   │   ├── services/          # s3, email, export (Excel), criteriaEngine, token
│   │   ├── db/                # pg pool, migrations, seeder
│   │   ├── jobs/              # node-cron deadline reminders
│   │   └── validators/        # Joi schemas
│   └── .env
│
├── nginx/                     # Nginx config (optional reverse proxy)
├── docker-compose.yml         # Local dev with Postgres
├── DEPLOYMENT.md
└── DESIGN.md
```

---

## License

This project is developed for academic/institutional use.  
© 2026 TNP Connect. All rights reserved.
