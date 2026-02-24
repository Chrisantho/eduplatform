# EduPlatform - Online Examination System

A complete production-ready Online Examination System built with React, Spring Boot, PostgreSQL, Docker, and Ansible.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Running Locally](#running-locally)
- [API Documentation](#api-documentation)
- [Features](#features)
- [Docker Deployment](#docker-deployment)
- [Ansible Deployment](#ansible-deployment)

## Overview

EduPlatform is a comprehensive online examination platform with:
- **Role-based access control** (ADMIN and STUDENT)
- **Exam management** (create, edit, delete exams)
- **Question types** (MCQ with auto-grading, Short Answer with manual grading)
- **Real-time exam timer** with WebSockets
- **Automatic and manual grading**
- **Student dashboard** with exam history
- **Admin dashboard** with analytics
- **User authentication** with JWT/Session
- **Email notifications** (password reset, exam assignments)
- **Dark/Light theme** support
- **File uploads** (profile pictures, documents)

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **React Router** (wouter) for client-side routing
- **TanStack React Query** for server state management
- **TailwindCSS** for styling with dark mode support
- **Shadcn/UI** component library
- **Framer Motion** for animations
- **Axios** for API calls

### Backend
- **Java 21** with Spring Boot 3.2.5
- **Spring Security** for authentication and authorization
- **Spring Data JPA** with Hibernate ORM
- **PostgreSQL** for database
- **WebSockets** via Spring WebSocket for real-time features
- **Multipart upload** for file handling
- **BCrypt** for password hashing
- **Maven** for build management

### Database
- **PostgreSQL** with Drizzle ORM schema definitions
- **Drizzle Kit** for migrations

### DevOps
- **Docker** for containerization
- **Docker Compose** for orchestration
- **Ansible** for infrastructure automation

## System Architecture

### Multi-Tier Architecture

```
┌─────────────────────────────────────────┐
│         Client (React/Browser)          │
│  - React Components                     │
│  - Dark/Light Theme                     │
│  - Real-time Countdown Timer            │
└────────────┬────────────────────────────┘
             │ HTTPS/WebSockets
┌────────────▼────────────────────────────┐
│      Frontend Server (Vite/Nginx)       │
│  - SPA Static Serving                   │
│  - API Proxying to Backend              │
│  - Static Asset Caching                 │
└────────────┬────────────────────────────┘
             │ HTTP/REST
┌────────────▼────────────────────────────┐
│   Backend API (Spring Boot, Port 8080)  │
│  - REST API Controllers                 │
│  - WebSocket Endpoints                  │
│  - Business Logic Services              │
│  - JWT/Session Authentication           │
│  - Role-Based Authorization             │
└────────────┬────────────────────────────┘
             │ JDBC
┌────────────▼────────────────────────────┐
│   PostgreSQL Database (Port 5432)       │
│  - Users, Exams, Questions              │
│  - Submissions, Answers, Results        │
│  - Notifications, Audit Logs            │
└─────────────────────────────────────────┘
```

### Project Structure

```
🏗️  Senior-Architect/
├── 📁 client/                    # React frontend (Vite SPA)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities and API client
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── public/                 # Static assets
│   ├── vite.config.ts          # Vite configuration
│   ├── tsconfig.json           # TypeScript config
│   └── package.json
│
├── 📁 backend/                 # Java Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/eduplatform/
│   │   │   │   ├── config/     # Spring configuration
│   │   │   │   ├── controller/ # REST API controllers
│   │   │   │   ├── entity/     # JPA entities
│   │   │   │   ├── repository/ # Data access layer
│   │   │   │   ├── service/    # Business logic
│   │   │   │   └── security/   # Auth & authorization
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── application-docker.properties
│   │   └── test/
│   ├── pom.xml                 # Maven dependencies
│   ├── Dockerfile              # Backend container
│   └── target/                 # Compiled JAR files
│
├── 📁 database/                # Database schema
│   ├── schema.sql              # Table definitions
│   └── seed.sql                # Sample data
│
├── 📁 shared/                  # Shared TypeScript code
│   ├── schema.ts               # Drizzle ORM schema
│   └── routes.ts               # API contract definitions
│
├── 📁 script/                  # Build scripts
│   └── build.ts                # Full stack build
│
├── docker-compose.yml          # Docker stack orchestration
├── Dockerfile                  # Frontend container
├── drizzle.config.ts           # Database migration config
├── tailwind.config.ts          # Tailwind CSS config
├── tsconfig.json               # TypeScript configuration
├── package.json                # Node.js dependencies
├── vite.config.ts              # Frontend Vite config
└── README.md                   # This file
```

## Setup & Installation

### Prerequisites

- **Node.js** 18+ (for build and dev server)
- **Java 21** (for Spring Boot backend)
- **Maven 3.8+** (for backend builds)
- **PostgreSQL 14+** (for database)
- **Docker** & **Docker Compose** (for containerized deployment)

### 1. Clone Repository

```bash
git clone <repository-url>
cd Senior-Architect
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies (frontend + build tools)
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/eduplatform_db

# Email Service (for password reset)
SENDGRID_API_KEY=your_sendgrid_api_key
ADMIN_EMAIL=admin@eduplatform.com

# Backend Configuration
JAVA_HOME=/path/to/java21
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Frontend Configuration
VITE_API_URL=http://localhost:8080/api

# Session Configuration
SESSION_SECRET=your_secure_random_secret_key_here
```

### 4. Create PostgreSQL Database

```bash
# Using psql (PostgreSQL command-line client)
createdb eduplatform_db
psql eduplatform_db < database/schema.sql
psql eduplatform_db < database/seed.sql  # Optional: load sample data
```

Or using Docker:

```bash
docker run --name eduplatform-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=eduplatform_db \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:15
```

### 5. Build Backend (Java)

```bash
cd backend
mvn clean package -DskipTests
cd ..
```

The compiled JAR will be at `backend/target/eduplatform-backend-1.0.0.jar`

## Running Locally

### Option 1: Development Mode (Single Command)

```bash
npm run dev
```

This script:
1. Starts the Node.js orchestrator
2. Builds backend JAR if needed
3. Starts Spring Boot on port 8080
4. Starts Vite dev server on port 5173
5. Exposes combined API via proxy

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run
# Backend runs on http://localhost:8080
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
# Frontend runs on http://localhost:5173
# API proxy: http://localhost:8080/api
```

### Option 3: Production Build

```bash
npm run build
npm start
```

This creates an optimized production build and runs it.

## API Documentation

### Authentication Endpoints

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user
- `POST /api/forgot-password` - Request password reset
- `POST /api/verify-reset-code` - Verify reset code
- `POST /api/reset-password` - Reset password

### Admin Endpoints

- `POST /api/admin/exams` - Create exam
- `GET /api/admin/exams` - List all exams
- `PUT /api/admin/exams/:id` - Update exam
- `DELETE /api/admin/exams/:id` - Delete exam
- `POST /api/admin/exams/:id/questions` - Add question to exam
- `GET /api/admin/results` - View all submissions
- `POST /api/admin/grade/:answerId` - Grade short answer

### Student Endpoints

- `GET /api/student/exams` - List assigned exams
- `GET /api/student/exams/:id` - Get exam details
- `POST /api/student/exams/:id/start` - Start an exam
- `POST /api/submissions` - Submit exam
- `GET /api/student/results` - View submission history

### WebSocket Events

- `timer:start` - Start exam countdown
- `timer:tick` - Timer update (every second)
- `timer:end` - Exam time expired
- `submission:received` - Submission acknowledged

## Features

### 1. Authentication System
- ✅ Login and Signup pages
- ✅ JWT-based authentication
- ✅ Role-based access (ADMIN/STUDENT)
- ✅ Automatic redirection based on role
- ✅ Secure password hashing (BCrypt)

### 2. Admin Dashboard
- ✅ Create/Edit/Delete exams
- ✅ Add MCQ and Short Answer questions
- ✅ Set exam duration and settings
- ✅ Assign exams to students
- ✅ View all students and their results
- ✅ Grade short answer questions
- ✅ View analytics (average score, pass rate)
- ✅ Real-time exam session monitor

### 3. Student Dashboard
- ✅ View assigned exams
- ✅ Start exam with real-time countdown
- ✅ Submit answers for questions
- ✅ Auto-submit when time expires
- ✅ View results after completion
- ✅ Search and filter past results
- ✅ See detailed score breakdown

### 4. Exam System
- ✅ Multiple question types (MCQ, Short Answer)
- ✅ Auto-grading for MCQs
- ✅ Manual grading for short answers
- ✅ Timed exams with countdown
- ✅ Auto-submit on timer expiry
- ✅ Prevent multiple attempts (configurable)
- ✅ Submission history

### 5. Real-Time Features
- ✅ WebSocket-based live countdown timer
- ✅ Real-time submission status
- ✅ Live exam monitoring for admin
- ✅ Cheating prevention via timer sync

### 6. User Profile
- ✅ Profile picture upload
- ✅ Bio/About section
- ✅ Email configuration
- ✅ Password change
- ✅ Profile visibility

### 7. Theme Support
- ✅ Dark mode toggle
- ✅ Light mode toggle
- ✅ Persistent theme selection
- ✅ System preference detection
- ✅ Tailwind dark mode integration

### 8. Notifications
- ✅ Welcome notification on signup
- ✅ Exam assignment notifications
- ✅ Result notifications
- ✅ Password reset confirmation
- ✅ In-app notification center

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost/api
# PostgreSQL: localhost:5432
```

### docker-compose.yml Structure

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: eduplatform_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/eduplatform_db
      JAVA_OPTS: -Xmx512m
    depends_on:
      - postgres

  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://backend:8080/api
    depends_on:
      - backend
```

## Ansible Deployment

### Prerequisites

```bash
# Install Ansible
pip install ansible

# Inventory file: ansible/inventory.ini
[production]
app-server ansible_host=192.168.1.100 ansible_user=deploy

# SSH key setup
ssh-keygen -t ed25519
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@192.168.1.100
```

### Run Deployment

```bash
# Execute playbook
ansible-playbook ansible/playbook.yml -i ansible/inventory.ini -v

# Specific tags
ansible-playbook ansible/playbook.yml -i ansible/inventory.ini -t docker,compose -v
```

### Playbook Tasks

1. ✅ Install Docker & Docker Compose
2. ✅ Clone repository
3. ✅ Configure environment variables
4. ✅ Build Docker images
5. ✅ Start services via docker-compose
6. ✅ Configure Nginx reverse proxy
7. ✅ Setup SSL certificates
8. ✅ Configure firewall rules

## Best Practices

### Security
- ✅ Passwords hashed with BCrypt
- ✅ JWT tokens for stateless auth
- ✅ CORS configured
- ✅ Input validation on all endpoints
- ✅ SQL injection protection via ORM
- ✅ Environment variables for secrets
- ✅ HTTPS in production

### Performance
- ✅ React Query for efficient caching
- ✅ Vite for optimized builds
- ✅ Code splitting for large bundles
- ✅ Database connection pooling
- ✅ Nginx caching for static assets
- ✅ gzip compression

### Code Quality
- ✅ TypeScript for type safety
- ✅ Consistent code style
- ✅ Component reusability
- ✅ Separation of concerns
- ✅ DRY principles

### Testing
```bash
# Frontend (if Jest is configured)
npm run test

# Backend (Maven)
cd backend
mvn test

# Type checking
npm run check
```

## Troubleshooting

### Issue: Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U user -d eduplatform_db -c "SELECT 1;"

# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Verify network connectivity
ping postgres-host
```

### Issue: Backend fails to start
```bash
# Check Java version
java -version  # Should be 21+

# Build backend
cd backend && mvn clean package -DskipTests

# Run with verbose logging
cd backend && mvn spring-boot:run -Dorg.slf4j.simpleLogger.defaultLogLevel=debug
```

### Issue: Frontend build fails
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Issue: WebSocket connection issues
```bash
# Check backend WebSocket is enabled
curl http://localhost:8080/actuator/health

# Check firewall
sudo ufw status
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues, questions, or suggestions:
- 📧 Email: support@eduplatform.com
- 🐛 GitHub Issues: https://github.com/eduplatform/issues
- 💬 Discussions: https://github.com/eduplatform/discussions

---

**Last Updated**: February 2026  
**Version**: 1.0.0 - Production Ready
