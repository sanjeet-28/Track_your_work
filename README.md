<div align="center">

# ⚡ TrackYourWork (TYW)

### *Enterprise-Grade Academic Productivity Engine & Time-Blocking Command Center*

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tests](https://img.shields.io/badge/Audit_Suite-49%2F49_Passed-brightgreen?style=for-the-badge&logo=checkmarx&logoColor=white)]()

<br />

**TrackYourWork** is an advanced, high-performance personal productivity engine engineered specifically for rigorous academic curricula, engineering workflows, and deep work sessions. Built with a reactive React 19 frontend and a decoupled Express/Prisma/MySQL backend, it delivers zero-latency task management, natural language entity extraction, Toggl-grade work session telemetry, and an incrementally streamed timeline calendar.

</div>

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Core Engineering Innovations](#-core-engineering-innovations)
  - [1. Virtualized Infinite Timeline Engine](#1-virtualized-infinite-timeline-engine)
  - [2. Autonomous Tokenizer & Course Detection](#2-autonomous-tokenizer--course-detection)
  - [3. Telemetric Work Session Tracking](#3-telemetric-work-session-tracking)
  - [4. Deep Work Analytics & Cognitive Heatmaps](#4-deep-work-analytics--cognitive-heatmaps)
  - [5. Reactive Inline Mutation & Micro-Interactions](#5-reactive-inline-mutation--micro-interactions)
- [Data Model & Schema (ERD)](#-data-model--schema-erd)
- [REST API Specification](#-rest-api-specification)
- [Technology Stack Matrix](#-technology-stack-matrix)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Database Migration & Seeding](#2-database-migration--seeding)
  - [3. Frontend Setup](#3-frontend-setup)
- [Automated Verification & Test Suites](#-automated-verification--test-suites)
- [License](#-license)

---

## 🏛 System Architecture

The application is structured as a decoupled, multi-tiered full-stack architecture prioritizing sub-50ms round-trip latency, high cache locality, and atomic database state transitions:

```mermaid
graph TD
    subgraph Client ["Client Tier (React 19 + Vite 8)"]
        UI[Tailwind v4 UI Components]
        Router[React Router v7]
        TC[TaskContext - Optimistic State]
        TimerCtx[TimerContext - Realtime Telemetry]
        ThemeCtx[ThemeContext - Zero-FOUC Provider]
        AxiosClient[Axios Interceptor Layer]
        
        UI --> TC
        UI --> TimerCtx
        UI --> ThemeCtx
        TC --> AxiosClient
        TimerCtx --> AxiosClient
    end

    subgraph API ["Server Tier (Node.js + Express 5)"]
        RouterMW[Express Router & CORS Middleware]
        ValMW[Sanitization & Validation Layer]
        TaskCtrl[Task Controller]
        CourseCtrl[Course & NLP Controller]
        TimerCtrl[Work Session Controller]
        AnalyticsCtrl[Analytics & Review Controller]

        AxiosClient -->|REST / JSON| RouterMW
        RouterMW --> ValMW
        ValMW --> TaskCtrl
        ValMW --> CourseCtrl
        ValMW --> TimerCtrl
        ValMW --> AnalyticsCtrl
    end

    subgraph Service ["Service Tier & Business Logic"]
        TaskSvc[Task Lifecycle Service]
        CourseSvc[Academic Course & Heatmap Service]
        TimerSvc[Precision Session Aggregator]
        AnalyticsSvc[Cognitive Scoring & Metrics Engine]

        TaskCtrl --> TaskSvc
        CourseCtrl --> CourseSvc
        TimerCtrl --> TimerSvc
        AnalyticsCtrl --> AnalyticsSvc
    end

    subgraph Persistence ["Persistence Tier (Prisma 6 + MySQL)"]
        Prisma[Prisma ORM 6.19.3 Engine]
        MySQL[(MySQL 8.0 Database)]

        TaskSvc --> Prisma
        CourseSvc --> Prisma
        TimerSvc --> Prisma
        AnalyticsSvc --> Prisma
        Prisma -->|Connection Pool| MySQL
    end
```

---

## 🔬 Core Engineering Innovations

### 1. Virtualized Infinite Timeline Engine
Traditional calendar grid components suffer from severe browser thread saturation and DOM bloat when rendering long-range dates. TrackYourWork implements a proprietary vertical timeline stream:
- **Bi-Directional Incremental Range Loader**: Initial load streams a balanced 21-day chronological window (`[today - 10d, today + 10d]`).
- **Dynamic Scroll Anchoring**: Loading future dates prepends elements to the DOM while measuring `delta = newScrollHeight - prevScrollHeight`, compensating scroll position within `requestAnimationFrame` to prevent layout jumps.
- **Strict 7:00 AM Daily Schedule Orientation**: Daily task sorting starts strictly at 07:00 AM as index `0`, flowing through daytime and evening, with post-midnight hours (00:00–06:59) gracefully organized at the end of the day cycle.
- **Partitioned Task Queues**: Automatically segments tasks into:
  - `INCOMPLETE`: Sorted ascending by `startTime` (07:00 AM prioritized).
  - `COMPLETED`: Sorted ascending by `startTime` and rendered beneath active tasks with zero strikethrough for readability.

### 2. Autonomous Tokenizer & Course Detection
Zero manual tagging required. The backend embeds an autonomous classification engine that analyzes task input strings via regex tokenizers:
- **Course Code Recognition**: Extracts academic identifiers matching standard nomenclature (e.g., `COL333`, `ELL205`, `APL107`, `AIL2872`). If the course doesn't exist, it dynamically creates the entity with a unique color swatch.
- **Task Type Extraction**: Intelligently identifies tags and study modes:
  - `lec`, `lecture` $\rightarrow$ **Lecture**
  - `tut`, `tutorial` $\rightarrow$ **Tutorial**
  - `pyq`, `pyqs`, `past paper` $\rightarrow$ **Previous Year Questions**
  - `ques`, `practice`, `problems` $\rightarrow$ **Question Practice**
  - `rev`, `revision` $\rightarrow$ **Revision**

### 3. Telemetric Work Session Tracking
Built for deep work cycles with stopwatch precision:
- **Stateful Timer Engine**: Tracks active session states directly in the database (`WorkSession`), guaranteeing persistence across browser restarts, route transitions, and machine reboots.
- **Multi-Session Cumulative Aggregation**: Tasks support an arbitrary number of distinct work intervals, calculating `actualDuration` down to the minute.
- **Planned vs. Actual Variance**: Automatically tracks time deviation to pinpoint productivity bottlenecks and task overestimation.

### 4. Deep Work Analytics & Cognitive Heatmaps
- **Productivity Score (0–100)**: Proprietary algorithm calculating performance based on:
  $$\text{Score} = (\text{Completion Rate} \times 0.40) + (\text{Consistency Factor} \times 0.35) + (\text{Focus Volume} \times 0.25)$$
- **Interactive 90-Day Contribution Heatmap**: Visualizes work density per calendar day with intensity tiers and tooltip analytics.
- **Course Distribution & Neglect Detector**: Flags courses that haven't received study sessions within threshold intervals, mitigating exam crunch.

### 5. Reactive Inline Mutation & Micro-Interactions
- **Double-Click In-Situ Time Editing**: Double-clicking the time banner on any task card activates a high-contrast inline time editor with real-time duration recalculation (`endTime - startTime`).
- **Safe Overnight Duration Handling**: Calculates intervals spanning midnight without throwing negative duration values or crashing UI threads.
- **Zero-FOUC Theme Architecture**: Centralized `ThemeContext` supporting `Light`, `Dark`, and `System` OS sync with instant local persistence and anti-flash DOM pre-injection.

---

## 🗄 Data Model & Schema (ERD)

The relational schema is enforced via **Prisma ORM 6.19.3** on MySQL:

```mermaid
erDiagram
    COURSE ||--o{ TASK : categorizes
    CATEGORY ||--o{ TASK : groups
    TASK ||--o{ TASK_TAG : tags
    TAG ||--o{ TASK_TAG : labeled_by
    TASK ||--o{ WORK_SESSION : logs
    
    COURSE {
        string id PK
        string code UK
        string name
        string color
        datetime createdAt
        datetime updatedAt
    }

    TASK {
        string id PK
        string title
        string date
        string startTime
        string endTime
        int estimatedDuration
        int actualDuration
        string priority
        string status
        string taskType
        string recurrenceType
        string courseId FK
        string categoryId FK
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    WORK_SESSION {
        string id PK
        string taskId FK
        datetime startTime
        datetime endTime
        int durationMinutes
        string notes
    }

    TAG {
        string id PK
        string name UK
        string color
    }

    SETTING {
        string id PK
        string key UK
        string value
    }

    DAILY_REVIEW {
        string id PK
        string date UK
        string summary
        int productivityScore
        int totalMinutes
    }
```

---

## 🔌 REST API Specification

### Tasks API (`/api/tasks`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/tasks` | Query tasks by date range (`startDate`, `endDate`), category, course, or priority |
| `POST` | `/api/tasks` | Create task with automatic course and task type regex extraction |
| `GET` | `/api/tasks/:id` | Fetch detailed task breakdown including aggregated work sessions |
| `PUT` | `/api/tasks/:id` | Full update of task properties, timings, course, and tags |
| `PATCH` | `/api/tasks/:id/status` | Atomic status toggle (`TODO` $\leftrightarrow$ `COMPLETED`) |
| `PATCH` | `/api/tasks/:id/reschedule`| Shift task date and timeline position |
| `POST` | `/api/tasks/:id/duplicate` | Clone task entity to another target date |
| `DELETE` | `/api/tasks/:id` | Cascade cleanup of task and associated work sessions |

### Timer & Sessions API (`/api/timer`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/timer/active` | Retrieve current running work session telemetry |
| `POST` | `/api/timer/tasks/:id/start` | Start live work timer for a task |
| `POST` | `/api/timer/tasks/:id/stop` | Commit and finalize work session with auto duration aggregation |
| `GET` | `/api/timer/tasks/:id/sessions` | Fetch session logs and historical intervals for a task |

### Academic Courses API (`/api/courses`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/courses` | List all tracked courses with active task counts |
| `POST` | `/api/courses` | Register new course with custom badge color |
| `GET` | `/api/courses/:id/heatmap` | 90-day activity matrix specific to course |
| `GET` | `/api/courses/analytics/daily` | Day-by-day distribution of course study time |
| `GET` | `/api/courses/analytics/overview` | Most-studied vs. neglected course analysis |
| `DELETE` | `/api/courses/:id` | Safe deletion with optional task preservation (`deleteTasks=false`) |

### Analytics & System API
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/analytics/score` | Compute aggregate 0–100 productivity score |
| `GET` | `/api/analytics/heatmap` | Generate yearly activity grid points |
| `GET` | `/api/analytics/daily` | Daily planned vs. actual duration series |
| `GET` | `/api/analytics/weekly` | Weekly workload breakdown |
| `GET` | `/api/export?format=json` | Full database export in structured JSON |
| `GET` | `/api/export?format=csv` | Flat CSV archive export |
| `GET` | `/api/settings` | Retrieve user configuration (Theme, Defaults) |
| `PUT` | `/api/settings` | Mutate global configuration parameters |

---

## 🛠 Technology Stack Matrix

| Layer | Technology | Version | Purpose |
|:------|:-----------|:--------|:--------|
| **Frontend Framework** | React | `^19.2.8` | High-concurrency UI rendering |
| **Build Tool** | Vite | `^8.3.0` | Ultra-fast HMR and bundle compilation |
| **Styling Engine** | Tailwind CSS | `^4.3.3` | Modern CSS design tokens, dark mode |
| **Charting Engine** | Recharts | `^3.10.1` | Responsive SVG time-series visualizations |
| **Iconography** | Lucide React | `^1.52.0` | Sleek, consistent stroke iconography |
| **Routing** | React Router | `^7.18.4` | Client-side routing with clean URL sync |
| **Server Framework** | Express | `^5.2.1` | High-throughput asynchronous REST API |
| **ORM** | Prisma | `6.19.3` | Type-safe query builder & schema migrations |
| **Database** | MySQL | `8.0+` | ACID-compliant relational persistence |
| **Linter / QA** | Oxlint / Node Test | Latest | Static code analysis and contract auditing |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher (tested with `v25.2.1`)
- **MySQL**: `v8.0` or higher running on `localhost:3306`
- **npm** or **pnpm**

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install production and development dependencies
npm install

# Configure environment variables
# Copy .env.example or create .env:
```

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL="mysql://root:password@localhost:3306/worktracker"
NODE_ENV=development
```

---

### 2. Database Migration & Seeding

```bash
# Sync database schema with MySQL (Prisma 6.19.3)
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Populate with realistic sample tasks, courses, and timer sessions
npm run seed
```

---

### 3. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install client dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will be available at: **`http://localhost:5173`**  
The backend API server will run at: **`http://localhost:5000`**

---

## 🧪 Automated Verification & Test Suites

The codebase includes an enterprise-grade automated testing suite verifying end-to-end operational readiness without browser dependencies:

```bash
cd backend

# Run the complete End-to-End QA & System Audit (49 test cases)
node test/full_qa_audit.js

# Run the Timeline Calendar Performance & Lazy-Load Test
node test/calendar_performance_test.js

# Run the Calendar Task Banner & Inline Time Mutation Test
node test/calendar_task_banner_test.js

# Run Core API Integration Test Suite
npm test
```

### Audit Verification Summary
```text
====================================================
  AUDIT COMPLETE: 49 PASSED, 0 FAILED  
====================================================
  ✔ System Health & Health Check API
  ✔ Centralized Settings & Zero-FOUC Theme Sync
  ✔ Autonomous NLP Course & Task Type Detection
  ✔ Precision Stopwatch Sessions & Actual Duration Accumulation
  ✔ Atomic Status Toggles & Temporal Rescheduling
  ✔ Safe Course Dissociation (Zero Task Orphanage)
  ✔ 90-Day Contribution Heatmaps & Academic Variance
  ✔ Full Structured Archive Export (JSON & CSV)
```

---

## 📦 Production Build

```bash
# Compile and optimize client-side bundle
cd frontend
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License

Distributed under the **ISC License**. Developed with precision for advanced personal productivity and academic command center operations.
