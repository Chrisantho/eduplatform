# Architecture Guide - EduPlatform

Comprehensive technical architecture documentation for EduPlatform system.

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Details](#component-details)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [API Architecture](#api-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Real-Time Features](#real-time-features)
- [Scalability Considerations](#scalability-considerations)
- [Security Architecture](#security-architecture)

## System Overview

EduPlatform is a distributed, scalable online examination system designed with modern cloud-native principles.

### Design Principles

1. **Separation of Concerns** - Clean boundaries between frontend, backend, and database
2. **Scalability** - Stateless services that can be horizontally scaled
3. **Resilience** - Circuit breakers, retry logic, and graceful degradation
4. **Security First** - Defense in depth with multiple security layers
5. **Observability** - Comprehensive logging, metrics, and tracing
6. **DevOps Ready** - Containerized, infrastructure-as-code compatible

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Web Browser (React SPA)                                     │  │
│  │  - Admin Dashboard                                           │  │
│  │  - Student Dashboard                                         │  │
│  │  - Real-time Exam Timer                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ HTTPS/WebSocket (TLS 1.3)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      API Gateway / CDN Layer                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Nginx / Cloudflare                                            │ │
│  │  - TLS Termination                                             │ │
│  │  - Request Rate Limiting                                       │ │
│  │  - Static Asset Caching                                        │ │
│  │  - Load Balancing                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ HTTP/REST/WebSocket
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Application Server Layer                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Spring Boot Backend (Java 21)                                 │ │
│  │  - REST API Endpoints                                          │ │
│  │  - WebSocket Server                                            │ │
│  │  - Business Logic Services                                     │ │
│  │  - Authentication & Authorization                              │ │
│  │  Multiple instances for HA/scalability                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ JDBC
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Data Layer                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Cluster (HA Primary + Replicas)                   │ │
│  │  - User Management                                             │ │
│  │  - Exam Definitions                                            │ │
│  │  - Student Submissions                                         │ │
│  │  - Audit Logs                                                  │ │
│  │  - Session Store                                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

Optional Components:
┌──────────────────────────────────────────────────────────────────────┐
│  Redis Cache      - Session cache, real-time data                   │
│  Message Queue    - Async notifications, background jobs             │
│  S3/Blob Storage  - File uploads, exports                            │
│  Elasticsearch    - Search indexing, analytics                       │
│  Prometheus       - Metrics collection                               │
│  ELK Stack        - Centralized logging                              │
│  Jaeger           - Distributed tracing                              │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend (React + Vite)

**Technology Stack:**
- React 18 with TypeScript
- Vite for dev server and build
- Wouter for client-side routing
- TanStack React Query for server state
- TailwindCSS for styling
- Radix UI for accessible components

**Architecture Pattern:**
```
client/src/
├── pages/                 # Route-based pages
│   ├── auth/             # Login, Register, password reset
│   ├── student/          # Student dashboard, exam history
│   ├── admin/            # Admin dashboard, exam management
│   └── exam/             # Exam taking interface
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/UI components (button, input, etc)
│   ├── layout/          # Layout components (Navbar, etc)
│   └── exam/            # Exam-specific components
├── hooks/               # Custom React hooks
│   ├── use-auth.ts      # Authentication context
│   ├── use-exams.ts     # Exam data fetching
│   └── use-*            # Other domain hooks
├── lib/                 # Utilities
│   ├── api.ts          # API client configuration
│   ├── queryClient.ts  # React Query setup
│   └── utils.ts        # Helper functions
└── App.tsx              # Main router component
```

**Data Flow:**
```
User Event → Component → Hook → API Call → Backend → Response → Cache → Re-render
                ↓
           Error Handler
                ↓
           Retry Logic
```

### 2. Backend (Spring Boot)

**Technology Stack:**
- Java 21
- Spring Boot 3.2.5
- Spring Security for auth
- Spring Data JPA for ORM
- Spring WebSocket for real-time
- Maven for build

**Architecture Pattern (DDD-inspired):**
```
backend/src/main/java/com/eduplatform/
├── config/              # Spring configuration
│   ├── SecurityConfig   # Security rules
│   ├── WebSocketConfig  # WebSocket setup
│   └── CorsConfig       # CORS settings
├── controller/          # REST endpoints
│   ├── AuthController   # /api/auth/*
│   ├── ExamController   # /api/exams/*
│   ├── AdminController  # /api/admin/*
│   └── StudentController# /api/student/*
├── service/             # Business logic
│   ├── AuthService      # Authentication & JWT
│   ├── ExamService      # Exam management
│   ├── SubmissionService# Submission handling
│   └── GradingService   # Auto-grading logic
├── entity/              # JPA entities (@Entity)
│   ├── User
│   ├── Exam
│   ├── Question
│   ├── Submission
│   └── Answer
├── repository/          # Data access (@Repository)
│   ├── UserRepository
│   ├── ExamRepository
│   └── ...
├── security/            # Auth implementations
│   ├── JwtProvider      # JWT token generation
│   └── CustomUserDetails # User principal
└── exception/           # Custom exceptions
    ├── ExamNotFoundException
    └── UnauthorizedException
```

**Request Processing Flow:**
```
HTTP Request
    ↓
SecurityFilter (JWT/Session validation)
    ↓
DispatcherServlet
    ↓
Controller → Service → Repository → Database
    ↓
Response Serialization (JSON)
    ↓
HTTP Response
```

### 3. Database (PostgreSQL)

**Core Tables:**
```sql
users               -- User accounts with role-based access
├── id (PK)
├── username (UNIQUE)
├── email
├── password (hashed)
├── role (ADMIN|STUDENT)
└── timestamps

exams               -- Exam definitions
├── id (PK)
├── title
├── description
├── duration (minutes)
├── created_by_id (FK → users)
├── is_active
└── timestamps

questions           -- Exam questions
├── id (PK)
├── exam_id (FK → exams)
├── text
├── type (MCQ|SHORT_ANSWER)
├── points
└── keywords (array for grading)

options            -- MCQ options
├── id (PK)
├── question_id (FK → questions)
├── text
└── is_correct

submissions        -- Student exam attempts
├── id (PK)
├── exam_id (FK → exams)
├── student_id (FK → users)
├── start_time
├── end_time
├── score
├── status (IN_PROGRESS|COMPLETED)
└── timestamps

answers            -- Student answers
├── id (PK)
├── submission_id (FK → submissions)
├── question_id (FK → questions)
├── selected_option_id (FK → options) -- MCQ
├── text_answer -- SHORT_ANSWER
├── is_correct (auto-graded or manual)
├── points_awarded
└── timestamps

notifications      -- User notifications
├── id (PK)
├── user_id (FK → users)
├── title
├── message
├── type (WELCOME|NEW_EXAM|RESULT|SYSTEM)
├── is_read
└── created_at

password_resets    -- Password reset tokens
├── id (PK)
├── user_id (FK → users)
├── code (unique token)
├── expires_at
├── used (boolean)
└── created_at
```

**Indexing Strategy:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_exams_created_by ON exams(created_by_id);
CREATE INDEX idx_submissions_exam_student ON submissions(exam_id, student_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_answers_submission ON answers(submission_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);
```

## Data Flow

### Exam Taking Flow

```sequence
Student                Frontend              Backend              Database
   │                      │                     │                    │
   │ Login                │                     │                    │
   ├─────────────────────→│                     │                    │
   │                      │ POST /api/login     │                    │
   │                      ├────────────────────→│                    │
   │                      │                     │ Validate & Create  │
   │                      │                     │ Session/JWT        │
   │                      │                     │                    │
   │ View Dashboard       │                     │                    │
   ├─────────────────────→│                     │                    │
   │                      │ GET /api/student/   │                    │
   │                      │ exams (with auth)   │                    │
   │                      ├────────────────────→│ SELECT * FROM      │
   │                      │                     │ exams WHERE ...    │
   │                      │ [Exam List]         │←───────────────────│
   │                      │←────────────────────┤                    │
   │ [Display Exams]      │                     │                    │
   │←─────────────────────┤                     │                    │
   │                      │                     │                    │
   │ Start Exam           │                     │                    │
   ├─────────────────────→│                     │                    │
   │                      │ POST /api/student/  │                    │
   │                      │ exams/{id}/start    │                    │
   │                      ├────────────────────→│ INSERT INTO        │
   │                      │                     │ submissions ...    │
   │                      │                     │ [Submission ID]    │
   │                      │ [Exam + Questions]  │←───────────────────│
   │                      │←────────────────────┤                    │
   │ [Exam Interface]     │                     │                    │
   │←─────────────────────┤                     │                    │
   │                      │ WebSocket Connect   │                    │
   │ ─────────────────────┼──────────┬──────────→                    │
   │                      │ (Timer Start Event)│                    │
   │ [Countdown Timer]    │←────────┬──────────┤                    │
   │                      │         │          │                    │
   │ [Take Exam...]       │         │          │                    │
   │ Submit Answer        │         │          │                    │
   ├─────────────────────→│         │          │                    │
   │                      │ POST /api/          │                    │
   │                      │ submissions/{id}/   │ INSERT INTO        │
   │                      │ answers             │ answers ...        │
   │                      ├────────────────────→│                    │
   │                      │ [Ack]              │→───────────────────│
   │                      │←────────────────────┤ Auto-grade MCQ    │
   │                      │                     │                    │
   │ Time Expires         │                     │                    │
   │                      │ WebSocket (timer_end)                   │
   │                      │←────────────────────┤                    │
   │ Auto-submit          │                     │                    │
   ├─────────────────────→│                     │                    │
   │                      │ POST /api/          │                    │
   │                      │ submissions/{id}/   │ UPDATE submission  │
   │                      │ submit              │ status = COMPLETE  │
   │                      ├────────────────────→│                    │
   │                      │                     │ Trigger grading    │
   │                      │ [Results]          │→───────────────────│
   │                      │←────────────────────┤ UPDATE answer scores
   │ [Results Page]       │                     │                    │
   │←─────────────────────┤                     │                    │
```

## API Architecture

### REST Endpoints Structure

```
/api/
├── auth/
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── GET /me
│   ├── POST /forgot-password
│   ├── POST /verify-reset-code
│   └── POST /reset-password
├── user/
│   ├── GET /profile
│   ├── PUT /profile
│   ├── POST /profile/avatar
│   └── POST /password-change
├── admin/
│   ├── POST /exams          // Create exam
│   ├── PUT /exams/{id}
│   ├── DELETE /exams/{id}
│   ├── POST /exams/{id}/questions
│   ├── PUT /questions/{id}
│   ├── DELETE /questions/{id}
│   ├── GET /results
│   ├── POST /grade/{answerId}
│   └── GET /analytics
├── student/
│   ├── GET /exams
│   ├── GET /exams/{id}
│   ├── POST /exams/{id}/start
│   └── GET /results
├── submissions/
│   ├── POST /answers
│   ├── POST /{id}/submit
│   └── GET /{id}
└── notifications/
    ├── GET /
    ├── PUT /{id}/read
    └── DELETE /{id}
```

### Response Format

```typescript
// Success Response
{
  data: T,                    // Response payload
  meta: {
    timestamp: ISO8601,
    version: "1.0"
  }
}

// Error Response
{
  error: {
    code: string,            // Error identifier
    message: string,         // User-friendly message
    details?: object         // Additional context
  },
  meta: {
    timestamp: ISO8601
  }
}
```

## Authentication & Authorization

### JWT-Based Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│  Client Authentication Flow                             │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────▼──────────┐
    │  POST /api/login  │
    │  {username, pwd}  │
    └────────┬──────────┘
             │
    ┌────────▼──────────────────────┐
    │ Backend:                       │
    │ 1. Validate credentials       │
    │ 2. Hash password check        │
    │ 3. Load user roles            │
    │ 4. Generate JWT token         │
    │ 5. Create session (optional)  │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ JWT Token Structure:           │
    │ Header: {alg, typ}            │
    │ Payload: {sub, role, exp}     │
    │ Signature: HMAC(SHA256)       │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Client Storage:                │
    │ localStorage.setItem('token') │
    │ (with HTTPOnly cookie option) │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Subsequent Requests:           │
    │ Header: Authorization: Bearer  │
    │ <token>                        │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Backend Validation:            │
    │ 1. Extract token from header  │
    │ 2. Verify signature           │
    │ 3. Check expiration           │
    │ 4. Load user permissions      │
    │ 5. Grant/Deny access          │
    └────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────┐
│           User Roles                │
├─────────────────────────────────────┤
│ ADMIN                               │
│ ├─ System Settings                  │
│ ├─ Exam Management (CRUD)           │
│ ├─ Question Management (CRUD)       │
│ ├─ User Management                  │
│ ├─ Analytics & Reports              │
│ └─ Result Grading                   │
│                                     │
│ STUDENT                             │
│ ├─ View Assigned Exams              │
│ ├─ Take Exams                       │
│ ├─ Submit Answers                   │
│ ├─ View Personal Results            │
│ ├─ Update Profile                   │
│ └─ View Notifications               │
└─────────────────────────────────────┘

@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController { ... }

@PostMapping("/exams/{id}/grade")
@PreAuthorize("hasRole('ADMIN')")
public void gradeAnswer(@PathVariable id) { ... }
```

## Real-Time Features

### WebSocket Architecture

```
Client WebSocket Connection
         │
         ├─ Connection: ws://backend/ws
         │
         ├─ Authentication: JWT in header
         │
         ├─ Events (exam timer):
         │   ├─ timer:start {examId, duration}
         │   ├─ timer:tick {remainingTime}
         │   ├─ timer:warning {remainingTime}
         │   └─ timer:end {}
         │
         ├─ Events (submissions):
         │   ├─ submission:received {answerId, status}
         │   ├─ submission:error {message}
         │   └─ submission:completed {score}
         │
         └─ Events (real-time monitoring):
             ├─ exam:started {userId, examId}
             ├─ exam:submitted {userId, examId, score}
             └─ exam:active-sessions {count, timestamp}
```

### Timer Synchronization

```
Challenge: Prevent client-side timer manipulation

Solution: Server-authoritative timing

┌─────────────────────────────────────┐
│  Server                             │
│  Time: 2024-02-24T10:00:00Z        │
│  Exam End: 2024-02-24T10:30:00Z    │
│  (30 minutes)                       │
└────────────┬────────────────────────┘
             │ WebSocket: timer:start
             │ payload: {endTime, duration}
             ├────────────────────────────┐
             │                            │
    ┌────────▼────────────────────┐       │
    │ Client                      │       │
    │ Calculates: endTime - now() │       │
    │ Starts countdown            │       │
    │ (updates UI every second)   │       │
    │                             │       │
    │ [Timer expires or user    │       │
    │  submits early]             │       │
    │ POST /api/submit            │       │
    │ (Server validates timing)   │       │
    └────────┬────────────────────┘       │
             │ ← Server recalculates      │
             │   based on submission time │
             │                            │
             └────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
    │
    ├─ Backend Instance 1 (Port 8080)
    ├─ Backend Instance 2 (Port 8081)
    ├─ Backend Instance 3 (Port 8082)
    └─ Backend Instance N

Each instance:
- Stateless (no server-side session state)
- Reads from PostgreSQL
- Uses Redis for distributed session (optional)
- WebSocket sticky sessions via load balancer
```

### Database Scalability

```
Write Operations:
PostgreSQL Primary (Write)
        │
        ├─ Replica 1 (Read)
        ├─ Replica 2 (Read)
        └─ Replica N (Read)

Connection Pool:
- Min connections: 10
- Max connections: 100
- Auto-scaling based on demand
```

### Caching Strategy

```
L1: Browser Cache (static assets, 1 year)
       │
       ├─ Service Worker (app shell)
       │
L2: CDN Cache (static files, API responses)
       │
       ├─ Nginx Cache (API responses, 5 min)
       │
L3: Redis Cache (session, exam questions)
       │
       └─ Database (source of truth)
```

## Security Architecture

### Defense-in-Depth Approach

```
Layer 1: Network Security
├─ HTTPS/TLS 1.3 (encryption in transit)
├─ DDoS Protection (Cloudflare)
├─ WAF Rules (ModSecurity)
└─ VPC Isolation (private networks)

Layer 2: API Security
├─ Rate Limiting (60 req/min per IP)
├─ CORS Configuration (whitelist origins)
├─ CSRF Token Validation
├─ Input Validation & Sanitization
└─ Output Encoding

Layer 3: Authentication
├─ Strong Password Requirements
├─ BCrypt Hashing (cost: 12)
├─ JWT Token Expiration (1 hour)
├─ Session Timeout (30 min)
└─ Multi-factor Authentication (optional)

Layer 4: Authorization
├─ Role-Based Access Control (RBAC)
├─ Resource-Level Permissions
├─ Audit Logging
└─ Permission Caching

Layer 5: Data Security
├─ Database Encryption (at rest)
├─ Column-Level Encryption (sensitive data)
├─ Parameterized Queries (SQL injection prevention)
├─ Secrets Management (HashiCorp Vault)
└─ Data Backups & Recovery

Layer 6: Application Security
├─ XSS Prevention (CSP, DOM sanitization)
├─ SQL Injection Prevention (ORM, parameterized queries)
├─ CSRF Protection (csrf tokens)
├─ Security Headers (HSTS, X-Frame-Options, etc)
└─ Dependency Scanning (vulnerability checks)
```

### Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Permissions-Policy: geolocation=(), microphone=(), camera=()
Referrer-Policy: strict-origin-when-cross-origin
```

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Production Ready
