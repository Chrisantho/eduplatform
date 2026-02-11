# replit.md

## Overview

EduPlatform is an Online Examination System that allows administrators to create and manage exams, and students to take exams and view their results. The platform features role-based access control (ADMIN and STUDENT roles), exam creation with MCQ and short answer questions, timed exam-taking, automatic scoring, notification system, student profiles with avatar uploads, password reset via email, and a dark/light theme toggle. It's built as a full-stack TypeScript application with a React frontend and Express backend, backed by PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Feb 2026**: Added notification system (replaces "My History" nav), student profile page with avatar upload/bio/performance stats, and forgot password flow with email code verification. Added email field to registration. Added Zod validation on profile updates. Security improvements to password reset (no account enumeration, no code leaking in responses).

## System Architecture

### Monorepo Structure
The project uses a single-repo layout with three main directories:
- `client/` — React frontend (Vite-based SPA)
- `server/` — Express backend (Node.js with TypeScript)
- `shared/` — Shared code between frontend and backend (schema definitions, API route contracts, types)

### Frontend Architecture
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router)
- **State Management**: TanStack React Query for server state; no Redux or global client state library
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives with TailwindCSS
- **Styling**: TailwindCSS with CSS variables for theming (light/dark mode), custom fonts (Inter, Outfit)
- **Animations**: Framer Motion for page transitions and UI effects
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express 5 on Node.js, running via `tsx` in development
- **Authentication**: Cookie-based sessions using Passport.js with LocalStrategy. Passwords hashed with scrypt. Session store uses `memorystore` (not persistent across restarts in dev).
- **Authorization**: Role-based (ADMIN, STUDENT) checked in route handlers
- **File Uploads**: Multer handles profile picture uploads, stored in `/uploads` directory, served as static files
- **Email**: Resend integration (optional) for password reset codes. Falls back gracefully if RESEND_API_KEY not configured.
- **WebSocket**: WebSocketServer is set up on the HTTP server (available for real-time features like exam timers, though currently optional)
- **API Pattern**: RESTful JSON API under `/api/` prefix. Route contracts are defined in `shared/routes.ts` with Zod schemas for input validation and response typing.
- **Build**: Production build uses esbuild for the server and Vite for the client. Output goes to `dist/` (server as `index.cjs`, client as `dist/public/`)

### Shared Layer (`shared/`)
- `schema.ts` — Drizzle ORM table definitions and Zod schemas (users, exams, questions, options, submissions, answers, notifications, password_resets). This is the single source of truth for database schema.
- `routes.ts` — API contract definitions with paths, methods, input schemas, and response schemas. Used by both client and server for type safety.

### Database
- **Engine**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod integration
- **Schema Management**: `drizzle-kit push` command to sync schema to database (no migration files needed for development)
- **Tables**: `users`, `exams`, `questions`, `options`, `submissions`, `answers`, `notifications`, `password_resets`
- **Storage Layer**: `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class, abstracting all database operations

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

1. **Shared API contracts** — Both frontend and backend reference `shared/routes.ts` for endpoint paths and validation schemas, ensuring type safety across the stack without code generation.

2. **Cookie-based sessions over JWT** — Despite the original spec mentioning JWT, the implementation uses express-session with Passport for simpler session management. The `credentials: "include"` pattern is used on all fetch calls.

3. **Drizzle ORM over other ORMs** — Chosen for its lightweight, type-safe SQL approach that integrates well with TypeScript and Zod.

4. **SPA with catch-all routing** — The server serves the Vite-built SPA for any non-API route, with wouter handling client-side routing. In development, Vite's dev server middleware provides HMR.

5. **Component library** — shadcn/ui components are copied into the project (not installed as a package), allowing full customization. Components live in `client/src/components/ui/`.

6. **Notification system** — Replaces the previous "My History" nav with a notifications bell. Auto-creates welcome notification on registration and "new exam" notifications for all students when admin creates an exam.

7. **Password Reset Security** — Uses generic responses to prevent account enumeration. Codes expire after 15 minutes. Email sending via Resend (optional).

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable. Required for the application to start.

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — Database ORM and schema management
- **express** (v5) — HTTP server framework
- **passport** + **passport-local** — Authentication
- **express-session** + **memorystore** — Session management
- **@tanstack/react-query** — Server state management on the client
- **zod** + **drizzle-zod** — Runtime validation and schema generation
- **framer-motion** — Animations
- **recharts** — Data visualization (exam scores, performance charts)
- **date-fns** — Date formatting and calculations
- **ws** — WebSocket support
- **wouter** — Client-side routing
- **multer** — File upload handling (profile pictures)
- **resend** — Email sending for password reset (optional, requires RESEND_API_KEY)

### Development Tools
- **Vite** — Frontend build tool and dev server with HMR
- **tsx** — TypeScript execution for the server in development
- **esbuild** — Server bundling for production
- **TailwindCSS** + **PostCSS** + **Autoprefixer** — CSS toolchain

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in development
- `@replit/vite-plugin-cartographer` — Dev tooling (conditionally loaded)
- `@replit/vite-plugin-dev-banner` — Dev environment banner (conditionally loaded)
