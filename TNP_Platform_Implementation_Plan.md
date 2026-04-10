# Training & Placement Management Platform
## Detailed Implementation Plan (PERN Stack + AWS Free Tier)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & AWS Free Tier Constraints](#2-tech-stack--aws-free-tier-constraints)
3. [System Architecture](#3-system-architecture)
4. [Database Schema (PostgreSQL)](#4-database-schema-postgresql)
5. [Backend Implementation (Node.js / Express)](#5-backend-implementation-nodejs--express)
6. [Frontend Implementation (React)](#6-frontend-implementation-react)
7. [AWS Deployment Plan](#7-aws-deployment-plan)
8. [Security Implementation](#8-security-implementation)
9. [Advanced Features Roadmap](#9-advanced-features-roadmap)
10. [Project Phases & Timeline](#10-project-phases--timeline)
11. [Folder Structure](#11-folder-structure)
12. [Environment Variables Reference](#12-environment-variables-reference)
13. [Viva Talking Points](#13-viva-talking-points)

---

## 1. Project Overview

**Platform Name:** TNP Connect  
**Type:** Cloud-native SaaS (Multi-tenant ready)  
**Stack:** PERN (PostgreSQL + Express + React + Node.js)  
**Deployment Target:** AWS Free Tier  

### Core Actors
| Actor | Responsibilities |
|-------|-----------------|
| Student | Profile management, job browsing, applying, status tracking |
| TNP Admin | Job posting, applicant management, report generation |
| System | Cron-based notifications, snapshot creation, analytics |

### Key Differentiators
- **Immutable Application Snapshots** — ensures data consistency even after profile updates
- **Criteria Matching Engine** — rule-based filtering with extensible scoring logic
- **Role-Based Access Control (RBAC)** — clean separation of student vs. admin flows
- **Cloud-native design** — stateless backend, S3 for file storage, JWT authentication

---

## 2. Tech Stack & AWS Free Tier Constraints

### PERN Stack Components

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **P** | PostgreSQL 15 | Primary relational database |
| **E** | Express.js 4.x | REST API framework |
| **R** | React 18 + Vite | Frontend SPA |
| **N** | Node.js 20 LTS | Runtime environment |

### Supporting Libraries

**Backend:**
```
express           - HTTP server
pg / pg-pool      - PostgreSQL client
jsonwebtoken      - JWT auth
bcryptjs          - Password hashing
multer            - File upload middleware
aws-sdk (v3)      - S3 integration
nodemailer        - Email notifications
node-cron         - Scheduled jobs
exceljs           - Excel export
joi               - Request validation
helmet            - HTTP security headers
cors              - CORS policy
morgan            - Request logging
dotenv            - Environment config
```

**Frontend:**
```
react-router-dom  - Client-side routing
axios             - HTTP client
react-query       - Server state management
react-hook-form   - Form handling
zod               - Schema validation
recharts          - Analytics charts
@tanstack/table   - Data tables
react-hot-toast   - Notifications UI
lucide-react      - Icons
tailwindcss       - Utility CSS
```

### AWS Free Tier Limits & Mapping

| AWS Service | Free Tier Limit | Usage in Project |
|-------------|----------------|-----------------|
| **EC2 t2.micro** | 750 hrs/month | Backend Node.js server |
| **RDS PostgreSQL db.t3.micro** | 750 hrs/month, 20 GB storage | Primary database |
| **S3** | 5 GB storage, 20,000 GET, 2,000 PUT | Resume / document storage |
| **SES (Simple Email Service)** | 62,000 emails/month (from EC2) | Notification emails |
| **CloudWatch** | 10 metrics, 5 GB logs | Monitoring & logging |
| **IAM** | Unlimited | Role-based AWS access |
| **Route 53** | $0.50/hosted zone (not free) | Optional — use EC2 public IP for dev |

> ⚠️ **Cost Safety Rules:**
> - Always set CloudWatch billing alerts at $1 and $5
> - Use single-AZ RDS (not Multi-AZ) — Multi-AZ is NOT free tier
> - Keep EC2 at t2.micro only
> - Enable S3 lifecycle rules to delete temp files after 30 days

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Cloud (Free Tier)                  │
│                                                           │
│  ┌──────────────┐     ┌──────────────────────────────┐  │
│  │  EC2 t2.micro │     │     RDS PostgreSQL            │  │
│  │               │     │     db.t3.micro               │  │
│  │  ┌──────────┐ │────▶│                               │  │
│  │  │ Node.js  │ │     │  - users                      │  │
│  │  │ Express  │ │     │  - profiles                   │  │
│  │  │ API      │ │     │  - jobs                       │  │
│  │  └──────────┘ │     │  - applications (snapshots)   │  │
│  │               │     │  - documents                  │  │
│  │  ┌──────────┐ │     └──────────────────────────────┘  │
│  │  │ React    │ │                                        │
│  │  │ Build    │ │     ┌──────────────────────────────┐  │
│  │  │ (served  │ │     │     S3 Bucket                 │  │
│  │  │  static) │ │────▶│     - resumes/               │  │
│  │  └──────────┘ │     │     - documents/              │  │
│  │               │     │     - profile-photos/         │  │
│  │  ┌──────────┐ │     └──────────────────────────────┘  │
│  │  │ Cron     │ │                                        │
│  │  │ Jobs     │ │     ┌──────────────────────────────┐  │
│  │  └──────────┘ │     │     SES (Email)               │  │
│  │               │────▶│     - notifications           │  │
│  └──────────────┘     │     - deadline alerts          │  │
│                         └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         ▲
         │ HTTPS
         ▼
┌─────────────────┐
│   Browser        │
│   (React SPA)    │
└─────────────────┘
```

### API Gateway Pattern (Express Router as API Gateway)

```
/api/v1/
├── /auth          → Auth Controller (login, register, refresh)
├── /students      → Student Controller (profile CRUD)
├── /jobs          → Jobs Controller (list, filter, post)
├── /applications  → Applications Controller (apply, track)
├── /admin         → Admin Controller (dashboard, export)
├── /documents     → Document Controller (upload, download via signed URL)
└── /notifications → Notification Controller (mark read, list)
```

### Data Flow: Student Applies for a Job

```
Student clicks "Apply"
        │
        ▼
React sends POST /api/v1/applications
        │
        ▼
Auth Middleware validates JWT → extracts student_id
        │
        ▼
Criteria Engine checks eligibility
  (CGPA, branch, skills, backlogs)
        │
        ├─ NOT eligible → 403 Forbidden
        │
        ▼
Application Service:
  1. Fetch current student profile from DB
  2. Create IMMUTABLE SNAPSHOT in applications table
     (copies: name, email, cgpa, branch, skills, resume_url AT THIS MOMENT)
  3. Set status = 'applied'
        │
        ▼
Return 201 Created with application_id
```

---

## 4. Database Schema (PostgreSQL)

### ERD Overview

```
users ──────────── student_profiles ──────── documents
  │                        │
  │                        │
  └── admin_profiles       └──────────────── applications ── jobs
                                                                │
                                                         job_criteria
                                                                │
                                                     interview_rounds
```

### SQL Schema

```sql
-- =============================================
-- USERS & AUTH
-- =============================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
    is_active       BOOLEAN DEFAULT TRUE,
    email_verified  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STUDENT PROFILES
-- =============================================

CREATE TABLE student_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal Info
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    date_of_birth   DATE,
    gender          VARCHAR(20),
    address         TEXT,
    
    -- Academic Info
    roll_number     VARCHAR(50) UNIQUE,
    branch          VARCHAR(100) NOT NULL,  -- e.g., 'Computer Science', 'Mechanical'
    graduation_year INTEGER NOT NULL,
    cgpa            DECIMAL(4,2) NOT NULL CHECK (cgpa >= 0 AND cgpa <= 10),
    active_backlogs INTEGER DEFAULT 0,
    total_backlogs  INTEGER DEFAULT 0,
    
    -- 10th & 12th
    tenth_percent   DECIMAL(5,2),
    twelfth_percent DECIMAL(5,2),
    
    -- Documents
    resume_url      VARCHAR(500),
    resume_s3_key   VARCHAR(500),
    photo_url       VARCHAR(500),
    
    -- Skills (stored as array for easy querying)
    skills          TEXT[] DEFAULT '{}',
    
    -- Metadata
    profile_complete BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE certifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    issuer      VARCHAR(255),
    issued_date DATE,
    cert_url    VARCHAR(500)
);

CREATE TABLE work_experiences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    company         VARCHAR(255) NOT NULL,
    role            VARCHAR(255) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,
    is_current      BOOLEAN DEFAULT FALSE,
    description     TEXT
);

-- =============================================
-- DOCUMENTS (Secure Vault)
-- =============================================

CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    doc_type        VARCHAR(50) NOT NULL, -- 'resume', 'marksheet', 'certificate', 'offer_letter'
    file_name       VARCHAR(255) NOT NULL,
    s3_key          VARCHAR(500) NOT NULL UNIQUE,
    file_size_bytes INTEGER,
    mime_type       VARCHAR(100),
    is_verified     BOOLEAN DEFAULT FALSE,
    uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_access_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    accessed_by UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(50) NOT NULL, -- 'view', 'download', 'verify'
    ip_address  INET,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- JOBS
-- =============================================

CREATE TABLE companies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    logo_url    VARCHAR(500),
    website     VARCHAR(500),
    sector      VARCHAR(100),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    created_by          UUID NOT NULL REFERENCES users(id),  -- admin user
    
    -- Job Details
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    job_type            VARCHAR(50) DEFAULT 'full_time', -- 'full_time', 'internship', 'contract'
    location            VARCHAR(255),
    salary_lpa          DECIMAL(10,2),  -- LPA (Lakhs Per Annum)
    
    -- Eligibility Criteria
    min_cgpa            DECIMAL(4,2) DEFAULT 0,
    max_active_backlogs INTEGER DEFAULT 0,
    allowed_branches    TEXT[] DEFAULT '{}',  -- empty = all branches
    required_skills     TEXT[] DEFAULT '{}',  -- empty = no skill requirement
    graduation_year     INTEGER,              -- NULL = all years
    
    -- Lifecycle
    status              VARCHAR(30) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'completed')),
    application_deadline TIMESTAMPTZ NOT NULL,
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- APPLICATIONS (IMMUTABLE SNAPSHOTS)
-- =============================================

CREATE TABLE applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES jobs(id),
    student_id      UUID NOT NULL REFERENCES student_profiles(id),
    
    -- Immutable Snapshot of student data AT TIME OF APPLICATION
    snapshot_data   JSONB NOT NULL,
    /*
      snapshot_data structure:
      {
        "full_name": "...",
        "email": "...",
        "roll_number": "...",
        "branch": "...",
        "cgpa": 8.5,
        "graduation_year": 2025,
        "skills": [...],
        "resume_url": "https://signed-url...",
        "tenth_percent": 90.5,
        "twelfth_percent": 88.0,
        "active_backlogs": 0,
        "certifications": [...],
        "work_experiences": [...]
      }
    */
    
    -- Application Status Pipeline
    status          VARCHAR(50) DEFAULT 'applied' 
                    CHECK (status IN (
                        'applied', 'shortlisted', 'interview_scheduled',
                        'interview_completed', 'offered', 'accepted', 'rejected', 'withdrawn'
                    )),
    
    applied_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one application per student per job
    UNIQUE(job_id, student_id)
);

CREATE TABLE interview_rounds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round_number    INTEGER NOT NULL,
    round_type      VARCHAR(50), -- 'aptitude', 'technical', 'hr', 'group_discussion'
    scheduled_at    TIMESTAMPTZ,
    location_or_link VARCHAR(500),
    result          VARCHAR(20) CHECK (result IN ('pass', 'fail', 'pending')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(50), -- 'job_posted', 'status_update', 'deadline_reminder', 'offer'
    is_read     BOOLEAN DEFAULT FALSE,
    metadata    JSONB,       -- { job_id, application_id, etc. }
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_student_profiles_branch ON student_profiles(branch);
CREATE INDEX idx_student_profiles_cgpa ON student_profiles(cgpa);
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_deadline ON jobs(application_deadline);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- =============================================
-- TRIGGERS: Auto-update updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 5. Backend Implementation (Node.js / Express)

### Project Initialization

```bash
mkdir tnp-backend && cd tnp-backend
npm init -y
npm install express pg jsonwebtoken bcryptjs multer @aws-sdk/client-s3 \
    @aws-sdk/s3-request-presigner nodemailer node-cron exceljs \
    joi helmet cors morgan dotenv uuid
npm install -D nodemon eslint
```

### Core Middleware Stack

```javascript
// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to your frontend domain in production
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined'));

// Routes
app.use('/api/v1/auth',          require('./routes/auth.routes'));
app.use('/api/v1/students',      require('./routes/student.routes'));
app.use('/api/v1/jobs',          require('./routes/job.routes'));
app.use('/api/v1/applications',  require('./routes/application.routes'));
app.use('/api/v1/admin',         require('./routes/admin.routes'));
app.use('/api/v1/documents',     require('./routes/document.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));

// Global error handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
```

### Authentication Middleware

```javascript
// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user still active
        const { rows } = await pool.query(
            'SELECT id, role, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );
        if (!rows[0] || !rows[0].is_active) {
            return res.status(401).json({ error: 'Account disabled' });
        }

        req.user = { id: decoded.userId, role: rows[0].role };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Role guard factory
const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
};

module.exports = { authenticate, requireRole };
```

### Criteria Matching Engine

```javascript
// src/services/criteriaEngine.service.js

/**
 * Checks if a student profile meets job eligibility criteria.
 * Returns { eligible: boolean, reasons: string[] }
 */
const checkEligibility = (profile, job) => {
    const reasons = [];

    // CGPA check
    if (profile.cgpa < job.min_cgpa) {
        reasons.push(`CGPA ${profile.cgpa} is below required ${job.min_cgpa}`);
    }

    // Backlog check
    if (profile.active_backlogs > job.max_active_backlogs) {
        reasons.push(`Active backlogs (${profile.active_backlogs}) exceed limit (${job.max_active_backlogs})`);
    }

    // Branch check
    if (job.allowed_branches.length > 0 && !job.allowed_branches.includes(profile.branch)) {
        reasons.push(`Branch '${profile.branch}' not in allowed list`);
    }

    // Graduation year check
    if (job.graduation_year && profile.graduation_year !== job.graduation_year) {
        reasons.push(`Graduation year mismatch`);
    }

    // Skills check — at least one required skill must match
    if (job.required_skills.length > 0) {
        const studentSkillsLower = profile.skills.map(s => s.toLowerCase());
        const hasSkill = job.required_skills.some(
            skill => studentSkillsLower.includes(skill.toLowerCase())
        );
        if (!hasSkill) {
            reasons.push(`Missing required skills: ${job.required_skills.join(', ')}`);
        }
    }

    return { eligible: reasons.length === 0, reasons };
};

/**
 * Computes a soft match score (0-100) for ranking/future ML integration
 */
const computeMatchScore = (profile, job) => {
    let score = 0;

    // CGPA contribution (max 30 points)
    const cgpaScore = Math.min((profile.cgpa / 10) * 30, 30);
    score += cgpaScore;

    // Skills overlap contribution (max 40 points)
    if (job.required_skills.length > 0) {
        const studentSkillsLower = profile.skills.map(s => s.toLowerCase());
        const matchedSkills = job.required_skills.filter(
            skill => studentSkillsLower.includes(skill.toLowerCase())
        );
        score += (matchedSkills.length / job.required_skills.length) * 40;
    } else {
        score += 40; // No skill requirement — full points
    }

    // Experience bonus (max 20 points)
    const expCount = profile.work_experiences?.length || 0;
    score += Math.min(expCount * 10, 20);

    // Certification bonus (max 10 points)
    const certCount = profile.certifications?.length || 0;
    score += Math.min(certCount * 5, 10);

    return Math.round(score);
};

module.exports = { checkEligibility, computeMatchScore };
```

### Application Snapshot Service

```javascript
// src/services/application.service.js
const { pool } = require('../db');
const { checkEligibility } = require('./criteriaEngine.service');
const { generateSignedUrl } = require('./s3.service');

const createApplication = async (studentUserId, jobId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Get full student profile with relations
        const profileResult = await client.query(`
            SELECT 
                sp.*,
                u.email,
                COALESCE(
                    json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL), '[]'
                ) AS certifications,
                COALESCE(
                    json_agg(DISTINCT we.*) FILTER (WHERE we.id IS NOT NULL), '[]'
                ) AS work_experiences
            FROM student_profiles sp
            JOIN users u ON u.id = sp.user_id
            LEFT JOIN certifications c ON c.student_id = sp.id
            LEFT JOIN work_experiences we ON we.student_id = sp.id
            WHERE sp.user_id = $1
            GROUP BY sp.id, u.email
        `, [studentUserId]);
        
        const profile = profileResult.rows[0];
        if (!profile) throw new Error('Profile not found');

        // 2. Get job with criteria
        const jobResult = await client.query(
            'SELECT * FROM jobs WHERE id = $1 AND status = $2',
            [jobId, 'open']
        );
        const job = jobResult.rows[0];
        if (!job) throw new Error('Job not found or closed');

        // 3. Check deadline
        if (new Date() > new Date(job.application_deadline)) {
            throw new Error('Application deadline has passed');
        }

        // 4. Run eligibility check
        const { eligible, reasons } = checkEligibility(profile, job);
        if (!eligible) {
            throw Object.assign(new Error('Not eligible'), { reasons, statusCode: 403 });
        }

        // 5. Build immutable snapshot
        const resumeSignedUrl = profile.resume_s3_key
            ? await generateSignedUrl(profile.resume_s3_key, 3600 * 24 * 30) // 30 days
            : null;

        const snapshot = {
            full_name:        profile.full_name,
            email:            profile.email,
            roll_number:      profile.roll_number,
            branch:           profile.branch,
            cgpa:             parseFloat(profile.cgpa),
            graduation_year:  profile.graduation_year,
            skills:           profile.skills,
            resume_url:       resumeSignedUrl,
            tenth_percent:    profile.tenth_percent,
            twelfth_percent:  profile.twelfth_percent,
            active_backlogs:  profile.active_backlogs,
            certifications:   profile.certifications,
            work_experiences: profile.work_experiences,
            snapshot_created_at: new Date().toISOString()
        };

        // 6. Insert application with snapshot
        const appResult = await client.query(`
            INSERT INTO applications (job_id, student_id, snapshot_data, status)
            VALUES ($1, $2, $3, 'applied')
            RETURNING *
        `, [jobId, profile.id, JSON.stringify(snapshot)]);

        await client.query('COMMIT');
        return appResult.rows[0];

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { createApplication };
```

### S3 Service (Signed URLs)

```javascript
// src/services/s3.service.js
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const BUCKET = process.env.S3_BUCKET_NAME;

/**
 * Upload file buffer to S3
 */
const uploadFile = async (buffer, mimeType, folder = 'documents') => {
    const key = `${folder}/${uuidv4()}`;
    
    await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256', // Encryption at rest
    }));

    return key;
};

/**
 * Generate a pre-signed GET URL (temporary secure access)
 */
const generateSignedUrl = async (s3Key, expiresInSeconds = 3600) => {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
    return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
};

module.exports = { uploadFile, generateSignedUrl };
```

### Excel Export Service

```javascript
// src/services/export.service.js
const ExcelJS = require('exceljs');
const { pool } = require('../db');

const exportApplicantsToExcel = async (jobId) => {
    const { rows } = await pool.query(`
        SELECT 
            a.id AS application_id,
            a.status,
            a.applied_at,
            a.snapshot_data,
            j.title AS job_title,
            c.name  AS company_name
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        JOIN companies c ON c.id = j.company_id
        WHERE a.job_id = $1
        ORDER BY a.applied_at ASC
    `, [jobId]);

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Applicants');

    // Header row
    worksheet.columns = [
        { header: 'S.No',            key: 'sno',             width: 6  },
        { header: 'Name',            key: 'full_name',       width: 25 },
        { header: 'Roll Number',     key: 'roll_number',     width: 15 },
        { header: 'Email',           key: 'email',           width: 30 },
        { header: 'Branch',          key: 'branch',          width: 20 },
        { header: 'CGPA',            key: 'cgpa',            width: 8  },
        { header: 'Active Backlogs', key: 'active_backlogs', width: 15 },
        { header: '10th %',          key: 'tenth_percent',   width: 10 },
        { header: '12th %',          key: 'twelfth_percent', width: 10 },
        { header: 'Skills',          key: 'skills',          width: 35 },
        { header: 'Status',          key: 'status',          width: 15 },
        { header: 'Applied At',      key: 'applied_at',      width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
    };

    // Data rows
    rows.forEach((row, index) => {
        const snap = row.snapshot_data;
        worksheet.addRow({
            sno:             index + 1,
            full_name:       snap.full_name,
            roll_number:     snap.roll_number,
            email:           snap.email,
            branch:          snap.branch,
            cgpa:            snap.cgpa,
            active_backlogs: snap.active_backlogs,
            tenth_percent:   snap.tenth_percent,
            twelfth_percent: snap.twelfth_percent,
            skills:          (snap.skills || []).join(', '),
            status:          row.status,
            applied_at:      new Date(row.applied_at).toLocaleString('en-IN'),
        });
    });

    // Generate buffer
    return workbook.xlsx.writeBuffer();
};

module.exports = { exportApplicantsToExcel };
```

### Cron Jobs (Deadline Reminders)

```javascript
// src/jobs/cronJobs.js
const cron = require('node-cron');
const { pool } = require('../db');
const { sendEmail } = require('../services/email.service');

// Run every day at 9 AM IST (3:30 AM UTC)
cron.schedule('30 3 * * *', async () => {
    console.log('[CRON] Running deadline reminder job...');

    try {
        // Find jobs whose deadline is in exactly 1 day
        const { rows: jobs } = await pool.query(`
            SELECT j.id, j.title, j.application_deadline, c.name AS company_name
            FROM jobs j
            JOIN companies c ON c.id = j.company_id
            WHERE j.status = 'open'
              AND j.application_deadline::date = CURRENT_DATE + 1
        `);

        for (const job of jobs) {
            // Find eligible students who have NOT applied
            const { rows: students } = await pool.query(`
                SELECT u.email, sp.full_name
                FROM student_profiles sp
                JOIN users u ON u.id = sp.user_id
                WHERE sp.cgpa >= (SELECT min_cgpa FROM jobs WHERE id = $1)
                  AND sp.id NOT IN (
                      SELECT student_id FROM applications WHERE job_id = $1
                  )
            `, [job.id]);

            for (const student of students) {
                await sendEmail({
                    to:      student.email,
                    subject: `⏰ Last day to apply: ${job.title} at ${job.company_name}`,
                    html:    `
                        <p>Hi ${student.full_name},</p>
                        <p>The application deadline for <strong>${job.title}</strong> 
                        at <strong>${job.company_name}</strong> is <strong>tomorrow</strong>.</p>
                        <p>Don't miss this opportunity! Log in to apply now.</p>
                    `
                });
            }
        }
        
        console.log(`[CRON] Sent reminders for ${jobs.length} job(s)`);
    } catch (err) {
        console.error('[CRON] Error in deadline reminder:', err);
    }
});
```

### Key API Routes Reference

```javascript
// src/routes/job.routes.js
const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const jobController = require('../controllers/job.controller');

// Public / Student routes
router.get('/',            authenticate, jobController.listEligibleJobs);
router.get('/:id',         authenticate, jobController.getJobById);

// Admin-only routes
router.post('/',           authenticate, requireRole('admin'), jobController.createJob);
router.put('/:id',         authenticate, requireRole('admin'), jobController.updateJob);
router.patch('/:id/close', authenticate, requireRole('admin'), jobController.closeJob);

module.exports = router;
```

---

## 6. Frontend Implementation (React)

### Project Setup

```bash
npm create vite@latest tnp-frontend -- --template react
cd tnp-frontend
npm install react-router-dom axios @tanstack/react-query react-hook-form \
    zod @hookform/resolvers recharts @tanstack/react-table \
    react-hot-toast lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Routing Structure

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import ProfilePage from './pages/student/ProfilePage';
import JobBoardPage from './pages/student/JobBoardPage';
import JobDetailPage from './pages/student/JobDetailPage';
import MyApplicationsPage from './pages/student/MyApplicationsPage';
import DocumentVaultPage from './pages/student/DocumentVaultPage';

// Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import PostJobPage from './pages/admin/PostJobPage';
import ManageJobsPage from './pages/admin/ManageJobsPage';
import ApplicantsPage from './pages/admin/ApplicantsPage';
import PlacementAnalyticsPage from './pages/admin/PlacementAnalyticsPage';

const PrivateRoute = ({ children, role }) => {
    const { user } = useAuthStore();
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Student Routes */}
                <Route path="/student" element={
                    <PrivateRoute role="student"><StudentLayout /></PrivateRoute>
                }>
                    <Route index element={<StudentDashboard />} />
                    <Route path="profile"      element={<ProfilePage />} />
                    <Route path="jobs"         element={<JobBoardPage />} />
                    <Route path="jobs/:id"     element={<JobDetailPage />} />
                    <Route path="applications" element={<MyApplicationsPage />} />
                    <Route path="documents"    element={<DocumentVaultPage />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={
                    <PrivateRoute role="admin"><AdminLayout /></PrivateRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="jobs/new"       element={<PostJobPage />} />
                    <Route path="jobs"           element={<ManageJobsPage />} />
                    <Route path="jobs/:id/applicants" element={<ApplicantsPage />} />
                    <Route path="analytics"      element={<PlacementAnalyticsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}
```

### Axios API Client with Token Refresh

```javascript
// src/lib/apiClient.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    withCredentials: true,
});

// Attach JWT on every request
apiClient.interceptors.request.use(config => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
    res => res,
    async error => {
        if (error.response?.status === 401 && !error.config._retry) {
            error.config._retry = true;
            try {
                const { data } = await axios.post('/api/v1/auth/refresh');
                useAuthStore.getState().setTokens(data.accessToken);
                error.config.headers.Authorization = `Bearer ${data.accessToken}`;
                return apiClient(error.config);
            } catch {
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
```

### Admin Analytics Dashboard (Key Component)

```jsx
// src/pages/admin/PlacementAnalyticsPage.jsx
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import apiClient from '../../lib/apiClient';

const COLORS = ['#2563EB', '#16A34A', '#DC2626', '#D97706', '#7C3AED'];

export default function PlacementAnalyticsPage() {
    const { data: analytics } = useQuery({
        queryKey: ['admin', 'analytics'],
        queryFn: () => apiClient.get('/admin/analytics').then(r => r.data),
    });

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Placement Analytics</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Students', value: analytics?.total_students },
                    { label: 'Total Placed',   value: analytics?.total_placed   },
                    { label: 'Placement Rate', value: `${analytics?.placement_rate}%` },
                    { label: 'Avg Package',    value: `₹${analytics?.avg_salary_lpa}L` },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-white rounded-lg p-4 shadow border">
                        <p className="text-gray-500 text-sm">{kpi.label}</p>
                        <p className="text-3xl font-bold text-blue-600">{kpi.value ?? '—'}</p>
                    </div>
                ))}
            </div>

            {/* Branch-wise Placement Bar Chart */}
            <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="font-semibold mb-4">Branch-wise Placement</h2>
                <BarChart width={600} height={300} data={analytics?.branch_stats || []}>
                    <XAxis dataKey="branch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="placed"    fill="#2563EB" name="Placed" />
                    <Bar dataKey="not_placed" fill="#E5E7EB" name="Not Placed" />
                </BarChart>
            </div>

            {/* Application Status Pie Chart */}
            <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="font-semibold mb-4">Application Status Distribution</h2>
                <PieChart width={400} height={300}>
                    <Pie data={analytics?.status_distribution || []}
                         dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100}>
                        {(analytics?.status_distribution || []).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </div>
        </div>
    );
}
```

---

## 7. AWS Deployment Plan

### Step 1: RDS PostgreSQL Setup

```bash
# Via AWS Console:
# 1. Go to RDS → Create Database
# 2. Engine: PostgreSQL 15
# 3. Template: Free tier
# 4. Instance: db.t3.micro
# 5. Storage: 20 GB gp2 (Free tier max)
# 6. Single-AZ (NOT Multi-AZ — that's not free)
# 7. Enable automated backups (7-day retention)
# 8. VPC Security Group: allow port 5432 from EC2 security group ONLY
```

### Step 2: S3 Bucket Setup

```bash
# Via AWS Console:
# 1. Create bucket: tnp-platform-documents-{your-unique-id}
# 2. Region: ap-south-1 (Mumbai — lowest latency for India)
# 3. Block all public access: ENABLED
# 4. Versioning: Disabled (saves storage)
# 5. Encryption: SSE-S3 (server-side encryption, free)

# Bucket policy — allow only from EC2 IAM role
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": { "AWS": "arn:aws:iam::ACCOUNT_ID:role/TNPAppRole" },
            "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            "Resource": "arn:aws:s3:::tnp-platform-documents-*/*"
        }
    ]
}

# Add lifecycle rule to delete unverified uploads after 7 days:
# S3 → Management → Lifecycle Rules → Add Rule
# Prefix: temp/
# Expiration: 7 days
```

### Step 3: IAM Role for EC2

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::tnp-platform-documents-*/*"
        },
        {
            "Effect": "Allow",
            "Action": ["ses:SendEmail", "ses:SendRawEmail"],
            "Resource": "*"
        }
    ]
}
```

### Step 4: EC2 Setup & Deployment

```bash
# Launch EC2:
# AMI: Amazon Linux 2023 (free)
# Instance type: t2.micro
# Storage: 8 GB gp3 (default, free)
# Security group inbound:
#   - Port 22  (SSH) from your IP only
#   - Port 80  (HTTP) from 0.0.0.0/0
#   - Port 443 (HTTPS) from 0.0.0.0/0

# Connect via SSH
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo dnf install -y nginx
sudo systemctl enable nginx

# Clone your repo
git clone https://github.com/yourusername/tnp-platform.git
cd tnp-platform/backend
npm install --production

# Set environment variables
sudo nano /etc/environment
# Add all .env variables

# Start app with PM2
pm2 start src/server.js --name "tnp-backend"
pm2 startup
pm2 save
```

### Nginx Configuration

```nginx
# /etc/nginx/conf.d/tnp.conf
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    # Serve React build (static files)
    location / {
        root /home/ec2-user/tnp-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # File upload size limit
    client_max_body_size 10M;
}
```

### Step 5: SES Email Setup

```bash
# 1. Go to AWS SES Console
# 2. Verify your sender email (e.g., noreply@yourcollege.com)
# 3. If in sandbox mode, also verify recipient emails for testing
# 4. Request production access when ready to send to all users
# 5. From EC2, emails are free (62,000/month limit)
```

### Free Tier Cost Monitoring

```bash
# Set billing alerts via CloudWatch:
# Billing → Budgets → Create Budget
# Budget: $0.01/month (alerts you before any real charges)
# Alert threshold: 80% of budget
```

---

## 8. Security Implementation

### JWT Token Strategy

| Token Type | Expiry | Storage |
|-----------|--------|---------|
| Access Token | 15 minutes | Memory (React state / Zustand) |
| Refresh Token | 7 days | HttpOnly Cookie |

```javascript
// Token generation
const generateTokens = (userId, role) => {
    const accessToken = jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};
```

### RBAC Matrix

| Action | Student | Admin |
|--------|---------|-------|
| View own profile | ✅ | ❌ |
| Edit own profile | ✅ | ❌ |
| View eligible jobs | ✅ | ✅ |
| Apply to job | ✅ | ❌ |
| View own applications | ✅ | ❌ |
| Upload documents | ✅ | ❌ |
| Create job posting | ❌ | ✅ |
| View all applicants | ❌ | ✅ |
| Export Excel | ❌ | ✅ |
| View analytics | ❌ | ✅ |
| Close job | ❌ | ✅ |
| Update application status | ❌ | ✅ |

### Input Validation (Joi Example)

```javascript
// src/validators/job.validator.js
const Joi = require('joi');

const createJobSchema = Joi.object({
    company_id:           Joi.string().uuid().required(),
    title:                Joi.string().min(3).max(255).required(),
    description:          Joi.string().min(50).required(),
    job_type:             Joi.string().valid('full_time', 'internship', 'contract').required(),
    salary_lpa:           Joi.number().min(0).max(200),
    min_cgpa:             Joi.number().min(0).max(10).required(),
    max_active_backlogs:  Joi.number().integer().min(0).default(0),
    allowed_branches:     Joi.array().items(Joi.string()).default([]),
    required_skills:      Joi.array().items(Joi.string()).default([]),
    graduation_year:      Joi.number().integer().min(2024).max(2030),
    application_deadline: Joi.date().iso().min('now').required(),
});
```

### Document Security

- All files stored in **private S3 bucket** (no public access)
- Files served via **pre-signed URLs** that expire (default: 1 hour)
- Every file access logged to `document_access_logs` table
- File type validation: only PDF, JPEG, PNG accepted
- File size limit: 5 MB per file
- S3 server-side encryption (AES-256) enabled

---

## 9. Advanced Features Roadmap

### Phase 2: Notification System

```javascript
// Email + In-app notification pattern
const notifyStudent = async (studentUserId, notification) => {
    // 1. Save to DB (in-app notification)
    await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, metadata)
        VALUES ($1, $2, $3, $4, $5)
    `, [studentUserId, notification.title, notification.message,
        notification.type, notification.metadata]);

    // 2. Send email (async, don't block main flow)
    const { rows } = await pool.query(
        'SELECT email FROM users WHERE id = $1', [studentUserId]
    );
    if (rows[0]) {
        sendEmail({ to: rows[0].email, ...notification }).catch(console.error);
    }
};
```

### Phase 3: Interview Workflow

```
Application Created
      │
      ▼ Admin shortlists
  SHORTLISTED
      │
      ▼ Admin schedules
 INTERVIEW_SCHEDULED
  (Round 1 - Aptitude)
      │
      ├── Pass ──▶ Round 2 - Technical
      │                │
      │                ├── Pass ──▶ Round 3 - HR
      │                │               │
      │                │               ├── OFFERED
      │                │               └── REJECTED
      │                └── REJECTED
      └── REJECTED
```

### Phase 4: AI Resume Parsing (Future Scope)

```javascript
// Using OpenAI API for resume parsing
const parseResume = async (resumeText) => {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
            role: 'user',
            content: `Extract skills, experience, and education from this resume as JSON: ${resumeText}`
        }],
        response_format: { type: 'json_object' }
    });
    return JSON.parse(response.choices[0].message.content);
};
```

---

## 10. Project Phases & Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| **Phase 1: Foundation** | DB schema, Auth (register/login/JWT), basic student profile CRUD | Week 1-2 |
| **Phase 2: Core Features** | Job posting, criteria matching, apply with snapshot, status tracking | Week 3-4 |
| **Phase 3: Admin Tools** | Admin dashboard, Excel export, job management, applicant view | Week 5 |
| **Phase 4: Documents** | S3 upload, signed URLs, document vault, access logs | Week 6 |
| **Phase 5: Notifications** | Email (SES), in-app notifications, cron deadline reminders | Week 7 |
| **Phase 6: Analytics** | Placement rate, branch stats, company trends, charts | Week 8 |
| **Phase 7: Deployment** | EC2 + RDS + S3 setup, Nginx, PM2, environment config | Week 9 |
| **Phase 8: Polish** | Testing, bug fixes, viva prep, documentation | Week 10 |

---

## 11. Folder Structure

```
tnp-platform/
├── backend/
│   ├── src/
│   │   ├── app.js                     # Express app setup
│   │   ├── server.js                  # HTTP server + cron start
│   │   ├── db/
│   │   │   ├── index.js               # pg pool
│   │   │   └── migrations/            # SQL migration files
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   ├── upload.middleware.js    # multer config
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── student.routes.js
│   │   │   ├── job.routes.js
│   │   │   ├── application.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── document.routes.js
│   │   │   └── notification.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── student.controller.js
│   │   │   ├── job.controller.js
│   │   │   ├── application.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── document.controller.js
│   │   │   └── notification.controller.js
│   │   ├── services/
│   │   │   ├── criteriaEngine.service.js
│   │   │   ├── application.service.js
│   │   │   ├── s3.service.js
│   │   │   ├── email.service.js
│   │   │   └── export.service.js
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   ├── student.validator.js
│   │   │   └── job.validator.js
│   │   └── jobs/
│   │       └── cronJobs.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── lib/
    │   │   └── apiClient.js
    │   ├── store/
    │   │   └── authStore.js             # Zustand auth state
    │   ├── layouts/
    │   │   ├── StudentLayout.jsx
    │   │   └── AdminLayout.jsx
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── RegisterPage.jsx
    │   │   ├── student/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── ProfilePage.jsx
    │   │   │   ├── JobBoardPage.jsx
    │   │   │   ├── JobDetailPage.jsx
    │   │   │   ├── MyApplicationsPage.jsx
    │   │   │   └── DocumentVaultPage.jsx
    │   │   └── admin/
    │   │       ├── Dashboard.jsx
    │   │       ├── PostJobPage.jsx
    │   │       ├── ManageJobsPage.jsx
    │   │       ├── ApplicantsPage.jsx
    │   │       └── PlacementAnalyticsPage.jsx
    │   ├── components/
    │   │   ├── ui/                       # Reusable UI components
    │   │   ├── JobCard.jsx
    │   │   ├── ApplicationStatusBadge.jsx
    │   │   ├── NotificationBell.jsx
    │   │   └── FileUploader.jsx
    │   └── hooks/
    │       ├── useAuth.js
    │       ├── useJobs.js
    │       └── useApplications.js
    ├── .env.example
    └── package.json
```

---

## 12. Environment Variables Reference

```bash
# backend/.env

# Server
NODE_ENV=production
PORT=5000

# Database (RDS)
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=tnp_platform
DB_USER=tnp_admin
DB_PASSWORD=your_strong_password

# JWT
JWT_SECRET=your_256_bit_random_secret
JWT_REFRESH_SECRET=another_256_bit_random_secret

# AWS (use IAM role on EC2 — no keys needed in prod)
AWS_REGION=ap-south-1
S3_BUCKET_NAME=tnp-platform-documents-yourId

# Email
SES_FROM_EMAIL=noreply@yourcollege.ac.in

# Frontend URL (for CORS)
FRONTEND_URL=http://your-ec2-public-ip
```

```bash
# frontend/.env

VITE_API_URL=http://your-ec2-public-ip/api/v1
```

---

## 13. Viva Talking Points

### High-Impact Lines to Memorize

> **"We implemented immutable application snapshots. Even if a student updates their CGPA or skills after applying, the recruiter sees the data as it was at the time of application — exactly like real-world job portals."**

> **"The Criteria Matching Engine filters jobs server-side, so students only see jobs they are eligible for. This reduces noise and simulates how enterprise ATS systems work."**

> **"Documents are stored in a private AWS S3 bucket. They are never publicly accessible. We generate pre-signed URLs that expire after one hour for secure, temporary access."**

> **"Every document access is logged with the user ID, IP address, and timestamp — giving us a full audit trail, which is required for compliance with the Indian IT Act."**

> **"We designed this as a cloud-native SaaS platform. The backend is stateless, authentication is JWT-based, and all user data is isolated by role — the same architecture used by Handshake and LinkedIn."**

> **"Future scope includes AI-based resume parsing using OpenAI APIs, and a machine-learning-powered job recommendation system based on the student's skill profile."**

### Explain the Snapshot Concept (When Asked)

*"When a student applies, we immediately freeze a copy of their entire profile — CGPA, skills, branch, and even a signed link to their resume — and store it in the `applications` table as a JSONB snapshot. This snapshot is immutable; no update to the student's live profile can change it. This is critical for fairness: two recruiters downloading the Excel report on different days will see identical data for each applicant."*

### Explain Why PostgreSQL Over MongoDB

*"PostgreSQL gives us ACID transactions, which are essential for the snapshot creation — we use a database transaction that either creates the entire application with snapshot or rolls back completely if any step fails. We also use array columns for skills and JSONB for snapshots, so we get both relational integrity and document flexibility."*

---

*Document Version: 1.0 | Stack: PERN | Deployment: AWS Free Tier | Region: ap-south-1 (Mumbai)*
