# Training & Placement Management Platform

> A centralized, cloud-native SaaS platform designed to streamline campus recruitment processes with secure document management, intelligent job matching, and automated administrative workflows.

**Tech Stack**: Next.js, TypeScript, Microservices, PostgreSQL, Kafka, GCP Storage, Vertex AI  
**Project Duration**: 10 weeks (70 days)

---

## Project Timeline

```mermaid
gantt
    title TNP Platform - 10-Week Development Schedule
    dateFormat YYYY-MM-DD
    
    section Week 1: Foundation
    Project Kickoff                     :milestone, m1, 2026-02-06, 0d
    Requirements Analysis               :plan1, 2026-02-06, 2d
    System Architecture Design          :crit, plan2, after plan1, 2d
    Database Schema Design              :plan3, 2026-02-06, 2d
    Technology Stack Setup              :setup1, after plan2, 2d
    GCP Environment Configuration       :setup2, after setup1, 1d
    
    section Week 2: Authentication & Core
    OAuth Integration                   :crit, auth1, 2026-02-13, 3d
    JWT Implementation                  :auth2, after auth1, 2d
    Role-Based Access Control           :auth3, after auth2, 2d
    PostgreSQL Setup                    :db1, 2026-02-13, 2d
    Core Database Models                :db2, after db1, 3d
    
    section Week 3: Student Profile System
    Profile Management API              :crit, profile1, 2026-02-20, 3d
    Education History Module            :profile2, after profile1, 2d
    Skills Management (JSON)            :profile3, after profile2, 2d
    Work Experience Module              :profile4, after profile3, 2d
    One-Click Apply Feature             :profile5, after profile4, 2d
    
    section Week 4: Document Vault
    GCP Storage Integration             :crit, vault1, 2026-02-27, 2d
    Document Upload Service             :vault2, after vault1, 2d
    Encryption Layer                    :vault3, after vault2, 2d
    OCR Integration (Vertex AI)         :vault4, after vault3, 2d
    Document Verification System        :vault5, after vault4, 2d
    Shareable Link Generation           :vault6, after vault5, 1d
    
    section Week 5: Job Management
    Job Posting API                     :crit, job1, 2026-03-06, 2d
    Eligibility Filter Engine           :job2, after job1, 3d
    Application Submission System       :job3, after job2, 2d
    Application Status Tracking         :job4, after job3, 2d
    Deadline Management                 :job5, after job4, 2d
    
    section Week 6: Notifications & Messaging
    Kafka Setup                         :crit, msg1, 2026-03-13, 2d
    Event-Driven Pipeline               :msg2, after msg1, 2d
    Notification Service                :msg3, after msg2, 2d
    Email Integration                   :msg4, after msg3, 2d
    Real-time Updates                   :msg5, after msg4, 1d
    
    section Week 7: Admin Dashboard & Export
    Admin Dashboard UI                  :crit, admin1, 2026-03-20, 3d
    Real-time Analytics                 :admin2, after admin1, 2d
    Excel Export Service                :admin3, after admin2, 2d
    Application Lock Mechanism          :admin4, after admin3, 2d
    Reporting Module                    :admin5, after admin4, 2d
    
    section Week 8: Frontend Development
    Next.js Application Setup           :crit, front1, 2026-03-27, 2d
    Student Portal UI                   :front2, after front1, 3d
    Admin Dashboard UI                  :front3, after front2, 3d
    Responsive Design                   :front4, after front3, 2d
    Form Components                     :front5, after front4, 2d
    
    section Week 9: Integration & Testing
    API Integration Testing             :crit, test1, 2026-04-03, 2d
    End-to-End Testing                  :test2, after test1, 2d
    Security Audit                      :test3, after test2, 2d
    Performance Testing (1000+ users)   :test4, after test3, 2d
    Bug Fixes                           :test5, after test4, 3d
    
    section Week 10: Deployment
    Production Environment Setup        :crit, deploy1, 2026-04-10, 2d
    Database Migration                  :deploy2, after deploy1, 1d
    GCP Deployment                      :deploy3, after deploy2, 2d
    Final Testing                       :deploy4, after deploy3, 2d
    Go Live                             :milestone, m2, after deploy4, 0d
    Post-Launch Monitoring              :deploy5, after deploy4, 2d
```

---

## Sprint Overview

```mermaid
gantt
    title TNP Platform - Sprint Timeline
    dateFormat YYYY-MM-DD
    
    section Sprint 1: Foundation
    Setup & Authentication          :crit, s1, 2026-02-06, 14d
    
    section Sprint 2: Core Features
    Profile & Document Vault        :crit, s2, after s1, 14d
    
    section Sprint 3: Job System
    Job Management & Notifications  :crit, s3, after s2, 14d
    
    section Sprint 4: Admin & UI
    Dashboard & Frontend            :crit, s4, after s3, 14d
    
    section Sprint 5: Launch
    Testing & Deployment            :crit, s5, after s4, 14d
    Go Live                         :milestone, after s5, 0d
```

---

## System Architecture

```mermaid
graph TD
    %% Actors
    Student([Student])
    Admin([TNP Admin])

    %% Frontend Layer
    subgraph Frontend ["Frontend (React)"]
        UI_Login[Login / Auth]
        UI_Profile[Profile Dashboard]
        UI_JobBoard[Job Board & Filters]
        UI_Admin[Admin Dashboard]
    end

    %% Backend Layer
    subgraph Backend ["Backend API (Node/Express)"]
        Auth_Svc[Auth Middleware]
        
        subgraph Logic_Core
            Profile_Mgr[Profile Manager]
            Criteria_Eng[Criteria Matching Engine]
            Apply_Svc[Application & Snapshot Service]
            Export_Svc[Excel/Report Generator]
        end
    end

    %% Data Layer
    subgraph Data_Layer ["Database & Storage"]
        DB_Users[(Users & Profiles Collection)]
        DB_Jobs[(Jobs & Criteria Collection)]
        DB_Applications[(Applications Snapshot Collection)]
        File_Store[Resume/File Storage]
    end

    %% Interactions - Student Flow
    Student -->|1. Register/Login| UI_Login
    Student -->|2. CRUD Details| UI_Profile
    UI_Profile -->|Update Data| Profile_Mgr
    Profile_Mgr -->|Save Live Data| DB_Users
    Profile_Mgr -->|Upload Resume| File_Store

    Student -->|3. View Jobs| UI_JobBoard
    UI_JobBoard -->|Request Eligible Jobs| Criteria_Eng
    Criteria_Eng -->|Fetch Student Profile & Job Criteria| DB_Users & DB_Jobs
    Criteria_Eng -.->|Return ONLY Matching Jobs| UI_JobBoard

    Student -->|4. Click Apply| UI_JobBoard
    UI_JobBoard -->|Trigger Application| Apply_Svc
    Apply_Svc -->|Fetch Current Profile Data| DB_Users
    Apply_Svc -->|Create Immutable Snapshot| DB_Applications
    
    %% Interactions - Admin Flow
    Admin -->|5. Create Job Post| UI_Admin
    UI_Admin -->|Save Criteria CGPA/Branch| DB_Jobs
    
    Admin -->|6. Download Excel| UI_Admin
    UI_Admin -->|Request Report| Export_Svc
    Export_Svc -->|Fetch Frozen Snapshots| DB_Applications
    Export_Svc -->|Generate .xlsx| Admin
```

---

## Project Phases

| Phase | Key Deliverables | Duration | Status |
|-------|-----------------|----------|--------|
| Week 1: Foundation | Architecture, DB Schema, GCP Setup | 7 days | Pending |
| Week 2: Authentication | OAuth, JWT, RBAC, Database Models | 7 days | Pending |
| Week 3: Profile System | Profile Management, Skills, One-Click Apply | 7 days | Pending |
| Week 4: Document Vault | Secure Storage, OCR, Verification | 7 days | Pending |
| Week 5: Job Management | Job Posting, Eligibility Filters, Applications | 7 days | Pending |
| Week 6: Notifications | Kafka, Event Pipeline, Email Integration | 7 days | Pending |
| Week 7: Admin Dashboard | Analytics, Excel Export, Reporting | 7 days | Pending |
| Week 8: Frontend | Next.js UI, Student & Admin Portals | 7 days | Pending |
| Week 9: Testing | Integration, Security, Performance Testing | 7 days | Pending |
| Week 10: Deployment | Production Setup, GCP Deployment, Go Live | 7 days | Pending |

---

## Key Features

### Student Portal
- Comprehensive profile management with education history and skills tracking
- Secure document vault with OCR-powered verification
- One-click job application using stored profile data
- Real-time application status tracking
- Automated deadline notifications

### Admin Dashboard
- Job posting with customizable eligibility criteria
- Real-time applicant statistics and analytics
- One-click Excel export of applicant data
- Application deadline management and locking
- Comprehensive placement analytics and reporting

### Security & Compliance
- End-to-end encryption for all documents
- OAuth-based authentication with JWT tokens
- Role-based access control (RBAC)
- Audit logs for all document access
- Compliance with Indian data protection regulations

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js, TypeScript | UI rendering, forms, student/admin portals |
| Backend | Microservices | Core APIs, authentication, data exports |
| Database | PostgreSQL | Profiles, jobs, applications storage |
| Storage | GCP Storage | Secure encrypted document vault |
| Messaging | Kafka | Event-driven notifications |
| AI Services | Vertex AI | OCR, skill matching, document verification |
| Cloud Platform | Google Cloud Platform | Hosting, scalability, security |

---

## Key Milestones

| Milestone | Date | Description |
|-----------|------|-------------|
| Project Kickoff | Feb 6, 2026 | Requirements finalization and team setup |
| Authentication Complete | Feb 19, 2026 | OAuth, JWT, and RBAC implemented |
| Profile System Ready | Feb 26, 2026 | Student profile management functional |
| Document Vault Live | Mar 5, 2026 | Secure storage with OCR operational |
| Job System Complete | Mar 12, 2026 | Job posting and application system ready |
| Notifications Active | Mar 19, 2026 | Kafka-based event pipeline functional |
| Admin Dashboard Ready | Mar 26, 2026 | Analytics and export features complete |
| Frontend Complete | Apr 2, 2026 | All UI components implemented |
| Testing Complete | Apr 9, 2026 | Security and performance validated |
| Production Launch | Apr 17, 2026 | Platform goes live |

---

## Non-Functional Requirements

### Performance
- Support 1000+ concurrent users
- Page load time under 3 seconds
- Real-time notification delivery
- Scalable microservices architecture

### Security
- AES-256 encryption for documents at rest
- TLS 1.3 for data in transit
- Comprehensive access logging
- Regular security audits
- Protected against unauthorized downloads

### Scalability
- Horizontal scaling via microservices
- Cloud-native architecture on GCP
- Event-driven messaging with Kafka
- Optimized database indexing

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- GCP Account
- Kafka

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/tnp-platform.git

# Install frontend dependencies
cd frontend
npm install

# Setup environment variables
cp .env.example .env

# Run database migrations
npm run migrate

# Start development servers
npm run dev
```

---

## Project Information

**Project Start**: February 6, 2026  
**Expected Completion**: April 17, 2026  
**Total Duration**: 10 weeks (70 days)  
**Development Team**: Full-stack developers, DevOps engineers, QA testers  
**Target Users**: 1000+ students, TPO administrators, external recruiters

---

## License

This project is proprietary software developed for academic institutions.

---

## Contact

For questions or support, please contact the development team or project administrators.
