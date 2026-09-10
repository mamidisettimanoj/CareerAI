# CareerAI

CareerAI is a student-focused Career & Placement Intelligence Platform designed to help students manage academics, skills, career preparation, placements, portfolios, resumes, goals, and daily priorities in one place.

CareerAI is built with a **100% client-side, local-first architecture**.

There is no backend server, external database, authentication service, or AI API dependency.

All student data is stored locally in the browser using **IndexedDB through Dexie.js**, while lightweight application settings are stored in `localStorage`.

---

## Overview

CareerAI combines academic intelligence, career readiness, preparation tracking, placement management, portfolio building, resume management, and student productivity into a single student operating system.

The platform is designed around deterministic intelligence engines that process the student's locally stored information and generate useful insights without sending personal data to external services.

### Core goals

- Help students understand their academic performance
- Track skills and identify skill gaps
- Measure career readiness
- Prepare for technical, aptitude, DSA, and interview rounds
- Track placement applications and interview progress
- Manage projects, internships, certifications, and achievements
- Build and maintain resumes
- Set goals and monitor progress
- Prioritize daily student tasks
- Work offline
- Keep student data locally controlled

---

## Key Features

### 1. Academic Intelligence

Track and analyze academic performance across semesters.

Features include:

- Semester management
- Subject management
- SGPA calculation
- CGPA calculation
- Attendance tracking
- Backlog tracking
- Academic analytics
- Academic trend analysis
- Target CGPA calculations
- Attendance requirement calculations

The academic module uses deterministic calculation and intelligence logic rather than external services.

---

### 2. Profile & Student Goals

Create and maintain a complete student profile.

Students can manage:

- Personal information
- Education details
- Career goals
- Target roles
- Skills
- Projects
- Certifications
- Internships
- Achievements
- Career objectives

CareerAI also calculates profile completeness and goal progress.

---

### 3. Career Intelligence

CareerAI evaluates a student's career readiness using locally available evidence.

The career module includes:

- Career readiness score
- Skill analysis
- Skill normalization
- Skill matrix
- Skill gap detection
- Role matching
- Career paths
- Technical readiness
- Resume readiness
- Career recommendations

Supported career path examples include:

- Software Engineer
- Data Analyst
- Product Manager

The system is designed so additional deterministic roles can be added over time.

---

### 4. Preparation Intelligence Center

A dedicated preparation environment for placement and technical preparation.

Includes:

- DSA practice
- Aptitude practice
- Technical MCQs
- Mock tests
- Interview preparation
- STAR-format interview answer preparation
- Attempt tracking
- Performance review
- Preparation readiness integration

Preparation performance contributes to the student's overall readiness insights.

---

### 5. Placement Center

Manage the complete student placement lifecycle locally.

Features include:

- Company directory
- Eligibility checking
- Placement drives
- Application tracking
- Application timelines
- Online tests
- Interview rounds
- Offers
- Rejections
- Withdrawals
- Placement analytics

### Application lifecycle

```text
SAVED
   ↓
APPLIED
   ↓
ASSESSMENT
   ↓
INTERVIEWING
   ↓
OFFERED

Alternative outcomes include:

REJECTED
WITHDRAWN

Eligibility is calculated deterministically using available academic and profile information such as:

CGPA
Backlogs
SSC
HSC
Student profile criteria
6. Portfolio Management

Build a structured student portfolio.

Manage:

Projects
Internships
Certifications
Achievements
Skills
Education evidence

Portfolio information can contribute to career readiness and placement preparation.

7. Resume Studio

CareerAI includes a browser-based Resume Studio.

Features include:

Multiple resume versions
Resume section visibility
ATS-friendly structure
Resume content management
Resume intelligence
Resume readiness analysis
Browser print-to-PDF workflow

Resume generation is performed entirely in the browser.

No server-side PDF generation service is required.

8. Student Command Center

CareerAI brings information from different modules together into a unified dashboard.

The command center can surface:

Academic status
Career readiness
Preparation progress
Placement activity
Goals
Daily priorities
Notifications
Important student tasks

The objective is to give students a single place to understand what requires attention.

9. Daily Productivity

CareerAI includes deterministic student productivity features such as:

Goal tracking
Goal progress
Daily priorities
Streak tracking
Overdue goal detection
Automatic goal generation based on available academic information
10. Notifications

The local notification intelligence system can generate reminders and alerts for events such as:

Upcoming interviews
Application deadlines
Certification expiry
Overdue goals
Active backlogs

Notifications are generated locally.

No push notification server is required.

11. Analytics

CareerAI provides cross-module analytics covering areas such as:

Academic performance
Career readiness
Skills
Preparation
Placement activity
Portfolio completeness
Goals and progress
12. Search

A unified local search interface allows students to find relevant information stored within the application.

Because the data is local, search does not require an external search service.

13. Backup & Restore

CareerAI provides local backup and restore functionality.

Students can:

Export application data
Import previously exported data
Validate backup structure
Restore data
Roll back after failed imports
Run local data health checks

The backup system includes validation and transactional data restoration.

14. Privacy Center

CareerAI follows a local-first privacy model.

Student information remains inside the browser.

The application does not require:

External authentication
Cloud database
Backend API
External analytics
Tracking pixels
External AI API keys

Students can also wipe their locally stored CareerAI data through the application.

15. PWA & Offline Support

CareerAI is designed as a Progressive Web App.

The application includes:

Web app manifest
Service worker
Cache versioning
Offline fallback
Offline status indicator
Installable application behavior

The application can continue functioning when network connectivity is unavailable, subject to the browser's local cache and storage state.

Architecture

CareerAI uses a local-first architecture.

┌──────────────────────────────────────┐
│              UI Layer                │
│      Next.js + React Components      │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│          Hooks / Services             │
│      Application & domain logic       │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│       Deterministic Engines           │
│                                      │
│ Academic Intelligence                │
│ Career Intelligence                  │
│ Readiness                            │
│ Eligibility                          │
│ Role Match                           │
│ Skill Gap                            │
│ Profile Completeness                 │
│ Assessment Scoring                   │
│ Resume Intelligence                  │
│ Project Intelligence                 │
│ Student Priority                     │
│ Goal Progress                        │
│ Streak                              │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│       Client Repositories             │
│      Local persistence layer          │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│          IndexedDB / Dexie.js         │
│             Local Browser Data        │
└──────────────────────────────────────┘

Lightweight application settings are stored separately in:

localStorage
Local-First Design

CareerAI deliberately avoids server-dependent architecture.

No backend

There is no:

Node.js backend
API server
server actions
REST API
database server
No external database

CareerAI does not use:

PostgreSQL
Prisma
Supabase
Firebase
No external authentication

CareerAI does not require:

Login
Signup
OAuth
Session cookies
Authentication providers
No external AI dependency

CareerAI does not expose:

OpenAI API keys
Gemini API keys
Server-side AI endpoints

Core intelligence is implemented through deterministic client-side engines.

Data Storage

CareerAI uses IndexedDB through Dexie.js as its primary persistence layer.

The application database contains data for the major platform modules.

The current database schema uses versioned migrations to support future application updates.

Examples of locally stored data include:

Student profile
Semesters
Subjects
Backlogs
Skills
Projects
Certifications
Internships
Achievements
Goals
Preparation attempts
Mock tests
Applications
Interviews
Offers
Resumes
Notifications
Intelligence results
Roadmaps

The primary database is:

CareerAI
Technology Stack
Technology	Purpose
Next.js	Application framework
React	UI layer
TypeScript	Application language
Tailwind CSS	Styling
shadcn/ui / Radix UI	UI components
Lucide React	Icons
Recharts	Data visualization
React Hook Form	Form management
Zod	Validation
Dexie.js	IndexedDB database layer
IndexedDB	Browser persistence
Vitest	Unit testing
Playwright	End-to-end testing
PWA Service Worker	Offline support
Project Structure

A simplified project structure is:

CareerAI/
│
├── e2e/
│   └── Playwright end-to-end tests
│
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon-192.png
│   ├── icon-512.png
│   └── other public assets
│
├── src/
│   ├── app/
│   │   └── Application routes
│   │
│   ├── components/
│   │   └── Reusable UI components
│   │
│   ├── domain/
│   │   └── Deterministic intelligence engines
│   │
│   ├── repositories/
│   │   └── Local client repositories
│   │
│   ├── services/
│   │   └── Application services
│   │
│   ├── lib/
│   │   └── Database and utility infrastructure
│   │
│   ├── hooks/
│   │   └── React hooks
│   │
│   ├── data/
│   │   └── Static question and reference data
│   │
│   └── types/
│       └── Shared application types
│
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
Intelligence Engines

One of CareerAI's core architectural strengths is its collection of deterministic domain engines.

These engines are designed as reusable logic rather than depending on a backend.

Current engine areas include:

Academic Intelligence

Analyzes:

Academic performance
Semester trends
Consistency
Backlogs
Academic Calculations

Provides:

SGPA
CGPA
Target CGPA
Attendance requirement calculations
Career Readiness

Evaluates multiple readiness dimensions using available student evidence.

Eligibility Engine

Determines placement eligibility using deterministic rules.

Role Match Engine

Compares student skills against career roles.

Skill Gap Engine

Identifies missing or insufficient skills.

Profile Completeness Engine

Measures how complete the student profile is.

Assessment Scoring Engine

Processes preparation and assessment results.

Resume Intelligence Engine

Analyzes resume-related readiness and evidence.

Project Intelligence Engine

Evaluates project evidence and contribution to student readiness.

Student Priority Engine

Generates prioritized student actions.

Goal Progress Engine

Tracks student progress toward defined goals.

These engines are covered by automated unit tests.

Testing

CareerAI uses automated testing for core deterministic behavior.

Current verification includes:

18 test files
158 tests
158 passed

Test coverage includes areas such as:

Academic intelligence
SGPA / CGPA calculations
Career intelligence
Readiness
Eligibility
Role matching
Skill gaps
Assessment scoring
Profile completeness
Preparation planning
Resume intelligence
Project intelligence
Student priorities
Goal progress
Streak logic

End-to-end tests are implemented with Playwright.

Build & Static Deployment

CareerAI is configured for static export.

The application uses:

output: 'export'

This means the application does not require a traditional application server or database server to run.

The application can be deployed to static hosting platforms that support Next.js static exports.

Running Locally
Prerequisites

Install:

Node.js
npm

Then clone the repository:

git clone https://github.com/mamidisettimanoj/CareerAI.git

Move into the project:

cd CareerAI

Install dependencies:

npm install

Run the development server:

npm run dev

Open the application in your browser:

http://localhost:3000
Production Build

Create a production build:

npm run build

Because the application uses static export, the generated static output is produced by the Next.js export process.

The resulting application can then be hosted on a compatible static deployment platform.

Running Tests

Run the unit test suite:

npm test

Run the end-to-end tests:

npx playwright test
Browser Storage Considerations

Because CareerAI is local-first, application data is stored in the user's browser.

This means:

Data is tied to the browser/device where it was created
Clearing browser site data can remove locally stored application data
Private/incognito browsing may have different storage behavior
Moving to another device requires using the backup/export functionality

For this reason, students should periodically export backups of important data.

Privacy

CareerAI is designed around the principle:

Your student data should stay with you.

The application does not require a cloud database or external authentication.

The local-first architecture reduces the need to transmit student information to external servers.

CareerAI does not intentionally include third-party analytics or tracking infrastructure.

Security Model

Because CareerAI is a fully client-side application, there is no application backend containing user credentials or student records.

However, browser-local applications have their own security considerations.

Users should:

Keep their devices secure
Avoid sharing exported backup files publicly
Use trusted browsers
Avoid installing modified or unofficial copies of the application

Local storage is not a substitute for operating-system-level device security.

Limitations

CareerAI is intentionally local-first.

That creates some trade-offs.

No multi-device synchronization

Data is not automatically synchronized between devices.

No cloud account

There is no remote student account system.

No server-side collaboration

Student data cannot currently be shared live with other users through the application.

Browser-dependent persistence

Stored information depends on browser storage availability and retention.

AI features

The current intelligence layer is primarily deterministic and local rather than dependent on external generative AI APIs.

Design Philosophy

CareerAI follows several principles.

Local First

Student information should remain locally controlled whenever possible.

Deterministic Intelligence

Important career and academic calculations should be reproducible and explainable.

Modular Architecture

Each major student capability is represented as a separate module.

Evidence-Based Readiness

Career readiness should come from actual student evidence such as:

Academic performance
Skills
Projects
Internships
Certifications
Resume
Preparation performance
Placement activity
Student-Centric Design

The system is designed for students rather than recruiters or administrators.

Current Platform Modules
CareerAI
│
├── Dashboard
├── Profile
├── Goals
├── Today
│
├── Academics
│   ├── Semesters
│   ├── Subjects
│   ├── Attendance
│   ├── Backlogs
│   └── Analytics
│
├── Skills
├── Career
│   └── Career Paths
│
├── Preparation
│   ├── DSA
│   ├── Aptitude
│   ├── Technical
│   ├── Mock Tests
│   └── Interview Preparation
│
├── Placement
│   ├── Companies
│   ├── Applications
│   ├── Interviews
│   ├── Online Tests
│   ├── Offers
│   └── Drives
│
├── Portfolio
├── Projects
├── Internships
├── Certifications
├── Achievements
│
├── Resume Studio
├── Analytics
├── Search
├── Notifications
│
├── Backup / Restore
├── Privacy Center
└── Settings
Version

Current release:

CareerAI v2.0.0

This release represents the local-first Student Operating System architecture.

Deployment

CareerAI is designed to run as a static web application.

The repository can be connected to a static-compatible deployment provider.

The project is configured with Next.js static export, so a backend database or server runtime is not required.

Contributing

CareerAI is currently maintained as a controlled project repository.

The project does not grant a license for copying, modifying, redistributing, or commercially reusing the source code.

Please review the repository's copyright and usage notice before using any part of the codebase.

Copyright

© 2026 CareerAI. All rights reserved.

The source code is provided for viewing and reference purposes only.

Unauthorized copying, modification, redistribution, or commercial use is not permitted.

Disclaimer

CareerAI provides academic calculations, career insights, readiness indicators, placement tracking, and preparation support based on information entered by the student.

CareerAI does not guarantee:

Job placement
Interview selection
Eligibility for every real-world company
Academic outcomes
Salary outcomes
Recruitment outcomes

Students should independently verify official company eligibility criteria and placement requirements before relying on them.

Project Vision

CareerAI is intended to evolve into a comprehensive student operating system that brings together:

Academics
     +
Skills
     +
Career Intelligence
     +
Preparation
     +
Placement
     +
Portfolio
     +
Resume
     +
Goals
     +
Productivity
     +
Analytics

The long-term objective is to give students one privacy-focused platform for managing their complete journey from college academics to career preparation and placement.
