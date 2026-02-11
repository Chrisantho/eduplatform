# replit.md

## Overview

EduPlatform is an Online Examination System that allows administrators to create and manage exams, and students to take exams and view their results. The platform features role-based access control (ADMIN and STUDENT roles), exam creation with MCQ and short answer questions, timed exam-taking, automatic scoring with keyword-based grading, notification system, student profiles with avatar uploads, password reset via email, and a dark/light theme toggle.

The project is structured as three independent folders:
- `frontend/` — React/Vite SPA
- `backend/` — Spring Boot (Java 21) REST API
- `database/` — PostgreSQL schema files

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Feb 2026**: Restructured project into three independent folders (frontend, backend, database). Backend completely rewritten from Node.js/Express to Java Spring Boot. Frontend updated to use standalone Vite config with API proxy to Spring Boot backend. All features preserved: auth, exams, notifications, profile, password reset.
- **Feb 2026**: Added SendGrid email integration for password reset. Email service runs as a Node.js HTTP server (port 3001) in the orchestrator, using Replit's SendGrid connector for credentials. Spring Boot backend calls this internal service when sending password reset codes. The EMAIL_SERVICE_URL environment variable is set automatically by the orchestrator.

## System Architecture

### Project Structure
- `frontend/` — React SPA with Vite dev server (port 5000)
- `backend/` — Spring Boot REST API (port 8080)
- `database/` — SQL schema files for PostgreSQL
- `server/index.ts` — Orchestrator that starts both backend JAR and frontend Vite server

### Frontend Architecture
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives with TailwindCSS
- **Styling**: TailwindCSS with CSS variables for theming (light/dark mode)
- **Animations**: Framer Motion for page transitions and UI effects
- **Path aliases**: `@/` maps to `frontend/src/`
- **API Types**: Defined in `frontend/src/lib/api.ts` (API_PATHS constants and TypeScript interfaces)
- **API Proxy**: Vite dev server proxies `/api` and `/uploads` requests to Spring Boot on port 8080

### Backend Architecture (Spring Boot)
- **Framework**: Spring Boot 3.2.5 with Java 21
- **Build Tool**: Maven (pom.xml in `backend/`)
- **Authentication**: Spring Security with session-based auth (JDBC session store), BCrypt password encoding
- **Authorization**: Role-based (ADMIN, STUDENT) checked in controllers
- **ORM**: Spring Data JPA with Hibernate
- **File Uploads**: Spring Multipart for profile picture uploads, stored in `uploads/` directory
- **Database Config**: `DataSourceConfig` parses DATABASE_URL environment variable for PostgreSQL connection
- **API Pattern**: RESTful JSON API under `/api/` prefix

### Key Backend Files
- `backend/src/main/java/com/eduplatform/config/SecurityConfig.java` — Spring Security configuration
- `backend/src/main/java/com/eduplatform/config/DataSourceConfig.java` — DATABASE_URL parsing
- `backend/src/main/java/com/eduplatform/controller/AuthController.java` — Auth endpoints (register, login, logout, profile, password reset)
- `backend/src/main/java/com/eduplatform/controller/ExamController.java` — Exam CRUD and submission endpoints
- `backend/src/main/java/com/eduplatform/controller/NotificationController.java` — Notification endpoints
- `backend/src/main/java/com/eduplatform/service/ExamService.java` — Exam creation, keyword grading logic

### Database
- **Engine**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Schema**: Defined in `database/schema.sql`
- **Tables**: `users`, `exams`, `questions`, `options`, `submissions`, `answers`, `notifications`, `password_resets`
- **Session Store**: Spring Session JDBC tables (auto-created)

### Key Pages
- `/` — Landing page
- `/login` — Login with forgot password link
- `/register` — Registration with optional email for password recovery
- `/forgot-password` — 3-step password reset (email → code → new password)
- `/student` — Student dashboard (available exams + completed history)
- `/student/notifications` — Notifications page (welcome, new exams, results)
- `/student/profile` — Profile page (avatar upload, bio, email, performance summary)
- `/student/history/:id` — Exam result details
- `/admin` — Admin dashboard (create/edit/delete exams)
- `/exam/:id` — Take exam page

### Key Design Decisions

1. **Three independent folders** — Frontend, backend, and database are separated for clear separation of concerns. They communicate via HTTP API.

2. **Spring Boot backend** — Java 21 with Spring Boot replaces the previous Node.js/Express backend. Uses Spring Security for auth and Spring Data JPA for database access.

3. **Cookie-based sessions** — Spring Session JDBC stores sessions in PostgreSQL. Frontend uses `credentials: "include"` on all fetch calls.

4. **Vite proxy** — In development, Vite dev server proxies API requests to Spring Boot backend, avoiding CORS issues.

5. **Component library** — shadcn/ui components are copied into the project, living in `frontend/src/components/ui/`.

6. **Keyword-based grading** — Short answer questions are graded by matching student answers against keywords. Scoring is proportional to matched keywords.

7. **Orchestrator pattern** — `server/index.ts` (run via `npm run dev`) spawns both the Spring Boot JAR and the Vite dev server as child processes.

## Running the Application

The workflow "Start application" runs `npm run dev`, which executes `server/index.ts`. This orchestrator:
1. Builds the Spring Boot backend JAR if not already built
2. Starts the Spring Boot backend on port 8080
3. Starts the Vite frontend dev server on port 5000

To rebuild the backend after Java code changes:
```bash
cd backend && mvn package -DskipTests -q
```

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable

### Key Frontend NPM Packages
- **@tanstack/react-query** — Server state management
- **framer-motion** — Animations
- **recharts** — Data visualization
- **date-fns** — Date formatting
- **wouter** — Client-side routing
- **zod** — Runtime validation

### Backend (Maven)
- **spring-boot-starter-web** — HTTP server
- **spring-boot-starter-data-jpa** — JPA/Hibernate ORM
- **spring-boot-starter-security** — Authentication/authorization
- **spring-session-jdbc** — JDBC session store
- **postgresql** — PostgreSQL JDBC driver

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in development
