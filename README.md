# Campus Nexus — College Club & Event Management Platform

[![Frontend Build](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Backend Build](https://img.shields.io/badge/Backend-Spring%20Boot%203.3.4%20%7C%20Java%2021-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel%20%2B%20Render-black?logo=vercel&logoColor=white)](https://vercel.com)

**Campus Nexus** is a modern, responsive collegiate club and event management platform. It empowers students to discover campus workshops, hackathons, seminars, and sports tournaments with real-time seat availability, and provides administrators with an analytics dashboard, event management tools, attendee rosters, and capacity safeguards.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [System Requirements](#system-requirements)
- [Local Development](#local-development)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Start Application](#3-start-application)
  - [4. Stop Application](#4-stop-application)
  - [Independent Service Startup](#independent-service-startup)
- [Environment Variables](#environment-variables)
  - [Frontend (Vercel / Vite)](#frontend-vercel--vite)
  - [Backend (Render / Spring Boot)](#backend-render--spring-boot)
- [Database Configuration](#database-configuration)
- [File Storage (Supabase Storage)](#file-storage-supabase-storage)
- [Security Architecture](#security-architecture)
- [Automated Testing](#automated-testing)
- [Production Deployment](#production-deployment)
- [Contributing](#contributing)

---

## Features

### Student & Public Portal
- **Hero & Featured Events:** Showcase flagship fests and hackathons with dynamic countdown badges, dates, and venues.
- **Event Discovery & Filtering:** Real-time search across event titles, venues, and descriptions, alongside category filters (*Hackathon, Workshop, Cultural, Sports, Technical, Competition, Career, Literary, Gaming, Seminar*).
- **Comprehensive Event Details:** View schedule, venue location, capacity status bar, remaining seats, and registration deadlines.
- **Validated Event Registration:** Responsive registration modal capturing student name, email, college, academic year, and contact number.
- **Duplicate & Capacity Safeguards:** Immediate feedback preventing duplicate registrations with the same email or registering for events at full capacity.

### Administrator Portal
- **Secure Authentication:** Stateless JWT-based authentication with BCrypt credential verification and brute-force rate limiting.
- **Real-Time Analytics Dashboard:** Key metrics at a glance: Total Events, Active Events, Total Registrations, and Average Capacity Utilization.
- **Event Management (CRUD):** Create new events with banner image uploads (or CDN image URLs), update event details and capacities, or delete events with cascade cleanup.
- **Registration Management:** Searchable attendee roster filtered by event or academic year with registration timestamps and contact information.
- **Responsive Admin Controls:** Full management capabilities optimized for desktop monitors, laptops, tablets, and mobile devices.

---

## Technology Stack

| Layer | Technologies | Version |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite, React Router, Lucide Icons | React 19.2, Vite 8.3, TS 6.0, Router 7.18 |
| **Styling** | Vanilla CSS Design System (Custom Spacing Tokens & CSS Grid) | Responsive (320px – 1440px+) |
| **Backend** | Spring Boot, Spring Security, Spring Data JPA, Hibernate, HikariCP | Spring Boot 3.3.4, Java 21 |
| **Authentication** | Stateless JWT (HS256) with Issuer & Audience validation | JJWT 0.11.5 |
| **Database** | PostgreSQL (Supabase Managed Postgres / Connection Pooler) | PostgreSQL 15+ |
| **Storage** | Supabase Storage (S3-compatible Object Storage for event banners) | S3 / REST API |
| **Hosting** | Vercel (Frontend SPA) + Render (Backend REST API Web Service) | Production Edge |

---

## Project Structure

```
Campus-Nexus/
├── backend/
│   ├── src/
│   │   ├── main/java/com/college/club/
│   │   │   ├── config/              # SecurityConfig, CorsConfig, DatabaseConfig, DataInitializer
│   │   │   ├── controller/          # REST endpoints (PublicEvent, PublicReg, Admin, Auth, Health)
│   │   │   ├── dto/                 # Request & Response Data Transfer Objects
│   │   │   ├── entity/              # JPA domain entities (Event, Registration, User)
│   │   │   ├── exception/           # Global exception handler & sanitized error responses
│   │   │   ├── repository/          # Spring Data JPA repositories with row-level locks
│   │   │   ├── security/            # JWT utility, filters, custom user details
│   │   │   └── service/             # Business logic & Supabase Storage integration
│   │   ├── main/resources/
│   │   │   ├── application.properties # Spring configuration with environment resolution
│   │   │   ├── sample-seed.sql      # Standalone idempotent sample data script for demo/staging
│   │   │   └── schema.sql           # Reference DDL schema with indexes and foreign keys
│   │   └── test/java/com/college/club/
│   │       ├── controller/          # HealthController unit test
│   │       ├── security/            # JwtUtil and RateLimitingFilter unit tests
│   │       └── service/             # RegistrationService and SupabaseStorageService tests
│   ├── .env.example                 # Backend environment variable template
│   ├── mvnw / mvnw.cmd              # Maven wrapper scripts
│   └── pom.xml                      # Maven project configuration (Java 21, Spring Boot 3.3.4)
├── frontend/
│   ├── public/                      # Static assets & SVG icons
│   ├── src/
│   │   ├── assets/                  # Hero illustration & logos
│   │   ├── components/              # EventCard, Navbar, Footer, Modals, Search, CategoryFilter
│   │   ├── context/                 # AuthContext & session management
│   │   ├── pages/                   # Home, Events, EventDetails, Admin Dashboard/Events/Regs
│   │   ├── services/                # API client modules (events, registrations, auth)
│   │   ├── types/                   # TypeScript interfaces (Event, Registration, User)
│   │   ├── App.tsx & main.tsx       # Root component & React 19 router
│   │   └── index.css                # Global design system, spacing scale & component styles
│   ├── .env.example                 # Frontend environment variable template
│   ├── package.json                 # Node dependencies and scripts
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── vercel.json                  # Vercel SPA direct route rewrite configuration
│   └── vite.config.ts               # Vite configuration
├── .env.example                     # Root reference environment variable template
├── .gitignore                       # Git ignore rules (secrets, node_modules, build targets)
├── DEPLOYMENT_GUIDE.md              # Complete step-by-step production deployment guide
├── render.yaml                      # Render Blueprint Infrastructure-as-Code
├── start.ps1                        # Primary one-click local startup script
├── stop.ps1                         # Primary one-click clean shutdown script
└── README.md
```

---

## System Requirements

- **Java Development Kit (JDK):** Version 21 or later ([Eclipse Temurin](https://adoptium.net/))
- **Node.js:** Version 20.x or later with `npm` ([Node.js](https://nodejs.org/))
- **Database:** Supabase PostgreSQL cloud instance or local PostgreSQL on port 5432
- **Git:** Version 2.30+

---

## Local Development

### 1. Clone Repository

```bash
git clone https://github.com/Prabhanshu2025B0384/CollegeNexus.git
cd CollegeNexus
```

### 2. Configure Environment Variables

Create `.env` in `backend/` and `frontend/` by copying the provided example templates:

```bash
# In backend directory:
copy backend\.env.example backend\.env

# In frontend directory:
copy frontend\.env.example frontend\.env
```

Ensure `backend/.env` has your database credentials, admin credentials, and a secure `JWT_SECRET` (at least 32 characters).

### 3. Start Application

Campus Nexus includes an automated PowerShell startup script that validates your environment, installs missing dependencies, starts both services in the background, waits for readiness, and opens your browser:

```powershell
.\start.ps1
```

Once running:
- **Student Portal:** `http://localhost:5173`
- **Admin Login:** `http://localhost:5173/admin`
- **Admin Dashboard:** `http://localhost:5173/admin/dashboard`
- **Backend API:** `http://localhost:8080/api`
- **Health Probe:** `http://localhost:8080/api/health`

### 4. Stop Application

To cleanly stop the background backend and frontend processes without affecting unrelated system tasks:

```powershell
.\stop.ps1
```

### Independent Service Startup

If you prefer running services in separate terminal windows:

**Terminal 1 — Backend:**
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Frontend (Vercel / Vite)

The frontend requires only **one public variable**. Sensitive credentials must never be passed to the client.

| Variable | Description | Required? | Example Value | Secret? |
| :--- | :--- | :---: | :--- | :---: |
| `VITE_API_URL` | Base REST API endpoint URL | **Yes** | `http://localhost:8080/api` *(Local)*<br>`https://campus-nexus-api.onrender.com/api` *(Prod)* | **NO** |

---

### Backend (Render / Spring Boot)

| Variable | Description | Required? | Example / Format | Secret? |
| :--- | :--- | :---: | :--- | :---: |
| `DATABASE_URL` | Supabase PostgreSQL connection URI | **Yes** | `postgresql://postgres.[REF]:[PASS]@[HOST]:5432/postgres` | **YES** |
| `JWT_SECRET` | 256-bit random key for signing admin tokens | **Yes** | 32+ character random string | **YES** |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | **Yes** | `https://campus-nexus.vercel.app` *(Prod)*<br>`http://localhost:5173` *(Local)* | **NO** |
| `ADMIN_PASSWORD` | Password for seeding initial admin user | **Yes** | Secure password | **YES** |
| `ADMIN_USERNAME` | Username for admin login (default: `admin@gmail.com`) | No | `admin@gmail.com` | **NO** |
| `ADMIN_EMAIL` | Admin contact email (default: `admin@collegeclub.edu`) | No | `admin@collegeclub.edu` | **NO** |
| `SUPABASE_SERVICE_KEY` | Supabase `service_role` key (required only for banner image upload) | Conditional | Secret key from Supabase Settings → API | **YES** |
| `SUPABASE_STORAGE_BUCKET`| Supabase bucket name (default: `SDMS`) | No | `SDMS` | **NO** |
| `SEED_SAMPLE_DATA` | Enable demo event seeding on empty DB (default: `false`) | No | `false` in production, `true` for demo | **NO** |
| `PORT` | Web server port (injected automatically by Render) | Auto | `8080` | **NO** |

> **Auto-Derived `SUPABASE_URL`:** The backend automatically derives `SUPABASE_URL` (`https://[PROJECT_REF].supabase.co`) from `DATABASE_URL`'s hostname or username. You do not need to configure `SUPABASE_URL` manually unless using a custom domain.

---

## Database Configuration

Campus Nexus connects to PostgreSQL via HikariCP connection pooling, pre-configured for Supabase Transaction Pooler (port 5432 / 6543) and direct connections.

- **Schema Auto-Update:** Hibernate manages table synchronization via `spring.jpa.hibernate.ddl-auto=update`.
- **Reference DDL:** The full database schema with explicit foreign keys and indexes is documented in [`backend/src/main/resources/schema.sql`](file:///c:/Users/idonp/OneDrive/Desktop/EventMangement/backend/src/main/resources/schema.sql).
- **Production Cleanliness Guarantee:** The application **never** auto-seeds dummy data into an empty production database (`app.seed.sample-data=false`).
- **Optional Staging Seed:** An idempotent SQL script with 10 realistic events is available in [`backend/src/main/resources/sample-seed.sql`](file:///c:/Users/idonp/OneDrive/Desktop/EventMangement/backend/src/main/resources/sample-seed.sql) to run manually in Supabase SQL Editor if desired.

---

## File Storage (Supabase Storage)

Campus Nexus supports custom banner image uploads for events via Supabase Storage:

1. **Bucket:** Configured in `app.supabase.storage-bucket` (default: `SDMS`). Must be marked **Public** in Supabase so uploaded images can be served globally via CDN.
2. **Strict Content Validation:** The backend inspects true file magic bytes (JPEG, PNG, WebP) and rejects disguised HTML, SVGs with embedded scripts, executable binaries, and files larger than 5MB.
3. **Optional Feature:** If `SUPABASE_SERVICE_KEY` is not provided, administrators can still assign event banners by entering any external image URL (e.g., Unsplash, Cloudinary, Imgur).

---

## Security Architecture

Campus Nexus incorporates defense-in-depth security hardening across the entire application lifecycle:

- **Stateless Authentication:** HS256 algorithm enforcement, claims verification (`iss=campus-nexus`, `aud=campus-nexus-api`), and tamper rejection.
- **Fail-Closed Secrets:** Application will not start if `JWT_SECRET` is missing, empty, or shorter than 256 bits (32 bytes).
- **Role-Based Authorization:** Method-level `@PreAuthorize("hasAuthority('ROLE_ADMIN')")` protects administrative mutation endpoints.
- **Brute-Force & Abuse Defense:** In-memory token bucket rate limiting on sensitive routes (5 attempts/min on `/api/auth/login`, 10 attempts/min on `/api/events/*/registrations`) returning HTTP 429 with `Retry-After`.
- **Capacity Race Condition Mitigation:** Event registration uses pessimistic write locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on event rows to eliminate Time-of-Check to Time-of-Use (TOCTOU) concurrency oversubscription.
- **HTTP Security Headers:** Content-Security-Policy (CSP), HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **Exception Sanitization:** Unhandled errors return structured JSON error envelopes (`ErrorResponse`) without leaking stack traces, database credentials, or internal file paths.

---

## Automated Testing

### Backend Unit & Integration Tests (JUnit 5)

The backend includes a comprehensive, automated test suite covering all critical security and business logic modules:

```bash
cd backend
./mvnw test
```

| Test Class | Verifications |
| :--- | :--- |
| `JwtUtilTest` | Token generation, validation, expiration detection, tampered signature rejection, algorithm pinning, fail-closed key validation |
| `RateLimitingFilterTest` | IP token bucket thresholds on auth & registrations, HTTP 429 response formatting, unthrottled GET routes |
| `SupabaseStorageServiceTest` | Magic byte detection (JPEG, PNG, WebP), SVG script rejection, HTML spoofing rejection, oversized file rejection (>5MB) |
| `RegistrationServiceTest` | Valid registration, registration closed handling, capacity limit boundary enforcement under pessimistic lock, duplicate email rejection |
| `HealthControllerTest` | Service uptime and readiness verification |

### Frontend Build & Linting

```bash
cd frontend

# Code style and syntax linting
npm run lint

# TypeScript type check and production bundling
npm run build
```

---

## Production Deployment

Campus Nexus is configured for zero-downtime, simple deployment across three managed cloud platforms:

```
 [ Client Browser ]
        │
        ▼ (HTTPS)
 [ Vercel Frontend ] ──────(REST / HTTPS)──────► [ Render Backend API ]
 (React 19 + Vite SPA)                           (Spring Boot 3.3.4 / Java 21)
                                                       │            │
                                         (JDBC + SSL)  │            │ (HTTP REST / API Key)
                                                       ▼            ▼
                                             [ Supabase Postgres ] [ Supabase Storage ]
                                             (Port 5432 / 6543)    (Bucket: SDMS)
```

1. **Database & Storage:** Set up a project on [Supabase](https://supabase.com). Create the public `SDMS` bucket and copy the Transaction Pooler URI.
2. **Backend API:** Connect repository to [Render](https://render.com) as a Web Service. Set Root Directory to `backend`, Build Command to `./mvnw clean package -DskipTests`, Start Command to `java -jar target/app.jar`, and Health Check to `/api/health`. Add the 4 core environment variables.
3. **Frontend:** Connect repository to [Vercel](https://vercel.com). Set Root Directory to `frontend`, Framework to `Vite`, and add `VITE_API_URL` pointing to your Render backend URL.
4. **Final Sync:** Update `CORS_ALLOWED_ORIGINS` on Render with your assigned Vercel URL.

👉 **For the complete step-by-step production walkthrough, read [`DEPLOYMENT_GUIDE.md`](file:///c:/Users/idonp/OneDrive/Desktop/EventMangement/DEPLOYMENT_GUIDE.md).**

---

## Contributing

1. Fork the repository and create a feature branch (`git checkout -b feature/amazing-feature`).
2. Verify all tests pass locally before committing:
   - Backend: `./mvnw clean test`
   - Frontend: `npm run lint && npm run build`
3. Commit changes (`git commit -m "feat: add amazing feature"`).
4. Push to branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.
