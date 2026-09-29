<!-- ===================================================================
     CAMPUS NEXUS — COLLEGE CLUB & EVENT MANAGEMENT PLATFORM
     =================================================================== -->

> [!IMPORTANT]
> ### 🔑 Demo Administrator Credentials
> This website includes an administrative management portal for college club organizers. To test and explore the administrative features, use the credentials below:
> - **Username / Email:** `admin@gmail.com`
> - **Password:** `admin`
> - **Login Location:** Click **"Admin Portal"** in the top navigation bar, or navigate directly to [`/admin/login`](http://localhost:5173/admin/login).

---

# Campus Nexus — College Club & Event Management Platform

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.3.4%20%7C%20Java%2021-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Storage](https://img.shields.io/badge/Storage-Supabase%20S3%20Bucket-3ECF8E?logo=amazon-s3&logoColor=white)](https://supabase.com/storage)
[![Hosting](https://img.shields.io/badge/Deployment-Vercel%20%2B%20Render-black?logo=vercel&logoColor=white)](https://vercel.com)

**Campus Nexus** is a modern, responsive collegiate club and event management platform. Designed specifically for college communities, it connects students with campus workshops, hackathons, seminars, cultural fests, and esports tournaments, while equipping club administrators with live attendee rosters, capacity controls, analytics dashboards, and cloud image management.

---

## Table of Contents

1. [Quick Setup & Local Run](#quick-setup--local-run)
2. [What Campus Nexus Does](#what-campus-nexus-does)
3. [Unique & Impressive Features](#unique--impressive-features)
   - [Smart Client-Side Caching & Optimistic UI](#1-smart-client-side-caching--optimistic-ui-tanstack-query-v5)
   - [Advanced Security & Data Integrity](#2-advanced-security--data-integrity)
   - [Cloud S3 Media Pipeline with Auto-Cleanup](#3-cloud-s3-media-pipeline-with-auto-cleanup)
   - [Cold-Start Server Wakeup Detection](#4-cold-start-server-wakeup-detection)
4. [Technology Stack](#technology-stack)
5. [REST API Endpoints](#rest-api-endpoints)
6. [Environment Configuration Reference](#environment-configuration-reference)

---

## Quick Setup & Local Run

### Prerequisites
Make sure the following tools are installed on your machine:
- **Java 21 JDK** (e.g., Eclipse Temurin, Oracle OpenJDK)
- **Node.js 18+** & **npm**
- **Git**

---

### Option A: One-Click Startup (Windows PowerShell)

The repository includes an automated launcher that verifies prerequisites, starts both backend and frontend background services, verifies health endpoints, and launches your browser:

```powershell
# From the project root directory:
.\start.ps1
```

To stop all background services cleanly when you're done:
```powershell
.\stop.ps1
```

---

### Option B: Manual Step-by-Step Startup

If you prefer running services in separate terminal windows:

#### 1. Start the Spring Boot Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
*The backend API will start on **http://localhost:8080** (health check at `http://localhost:8080/api/health`).*

#### 2. Start the React / Vite Frontend
```powershell
cd frontend
npm install
npm run dev
```
*The student portal will start on **http://localhost:5173**.*

---

## What Campus Nexus Does

### For Students & Campus Visitors
- **Flagship Event Showcase:** Hero and featured sections spotlighting the club's biggest events with live countdown tags, schedule information, and venue details.
- **Search & Multi-Category Filtering:** Real-time search across titles and descriptions, filterable across categories (*Technical, Workshop, Hackathon, Cultural, Sports, Competition, Career, Literary, Gaming, Seminar*).
- **Seat Availability & Status Badges:** Visual capacity progress indicators displaying total seats, registrations count, and status (*Open*, *Closed*, *Sold Out*).
- **One-Click Verified Registration:** Fast modal-based registration validating student details (Full Name, College Email, College/University, Academic Year, Phone) with instantaneous duplicate checks.
- **Instant Sharing:** Integrated clipboard share action generating direct links to specific event details.

### For Club Administrators & Organizers
- **Executive Analytics Dashboard:** High-level metrics showing Total Events, Active Events, Total Student Registrations, and Average Capacity Utilization.
- **Event Lifecycle Management (CRUD):** Create and edit events with date/time pickers, capacity quotas, venue specifications, and direct banner image uploads.
- **Attendee Management & Roster Export:** Searchable attendee roster filterable by event and academic year with timestamps and contact info.
- **Immediate Safeguards:** Prevents registrations past event deadlines or beyond venue seat capacity.

---

## Unique & Impressive Features

### 1. Smart Client-Side Caching & Optimistic UI (TanStack Query v5)
Campus Nexus feels instant and fluid because it does not re-fetch data unnecessarily:
- **5-Minute Stale-Time Caching:** Event rosters, dashboard metrics, and event details stay in memory for 5 minutes. Navigating between views is instantaneous with zero loading spinners.
- **Background Prefetching:** On visiting the home page, the application automatically prefetches event categories and the events catalog in the background so that clicking "Explore Events" feels instantaneous.
- **Optimistic Deletions:** When an administrator deletes an event or attendee registration, the item disappears from the table immediately before the server response returns. If the backend fails, the table automatically rolls back to its previous state.
- **Synchronized URL Query State:** Search keywords and active category filters are debounced (350ms) and synchronized with browser URL parameters (`?search=hackathon&category=Technical`), allowing students to bookmark and share pre-filtered views.

### 2. Advanced Security & Data Integrity
The backend is hardened with enterprise security practices:
- **Stateless JWT Authentication:** Secure HS256-signed tokens with issuer/audience validation and BCrypt password encryption for administrative accounts.
- **Token-Bucket Rate Limiter (Spam & Brute-Force Prevention):** An in-memory IP-based rate limiting filter safeguards public registration endpoints (max 5 submissions/min per IP) and admin authentication (max 5 attempts/15s per IP) to prevent automated spam and credential-stuffing attacks.
- **Pessimistic Concurrency Locking (`PESSIMISTIC_WRITE`):** High-demand event registrations acquire database row locks during the registration transaction, guaranteeing that events cannot be overbooked even when multiple students register at the exact same millisecond.
- **Sanitized Error Responses:** Internal stack traces, database schema specifics, and vendor errors are masked through a centralized `@RestControllerAdvice` global exception handler.
- **Hardened HTTP Headers & CORS:** Explicit whitelist for trusted frontend origins, alongside `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict HSTS headers.

### 3. Cloud S3 Media Pipeline with Auto-Cleanup
- **Supabase S3 Object Storage:** Event banner images are uploaded directly to an S3-compatible cloud bucket rather than bloating the application database.
- **File Validation & Safe Naming:** Uploads are strictly validated against allowed image MIME types (WebP, PNG, JPEG, GIF) with size restrictions and stored with cryptographically random UUID keys to prevent path traversal and collision.
- **Automated Orphan Cleanup:** Whenever an event is deleted or its banner image is replaced with a new one, the backend automatically issues an S3 delete request to purge the old image, preventing orphaned files and unnecessary storage costs.

### 4. Cold-Start Server Wakeup Detection
- **Cloud Sleep-State Awareness:** In production environments hosting the backend on free-tier infrastructure (such as Render or Fly.io), backend instances automatically enter sleep mode after 15 minutes of inactivity.
- **Dynamic 3.5s Threshold Detection:** The frontend API client automatically monitors in-flight request duration; if a request takes longer than 3.5 seconds, it fires an event to render an animated status banner informing visitors that the backend server is spinning up.
- **Graceful Extended Timeout (45s):** Replaces short browser timeouts with a 45-second threshold, ensuring requests do not artificially abort while the server is waking up, and smoothly dismisses the banner once the service responds.

---

## Technology Stack

| Layer | Technology | Key Details |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite | Modern SPA with code-splitting and zero bundle bloat |
| **State & Caching** | TanStack Query v5 (React Query) | 5-min stale times, background prefetching, optimistic mutations |
| **Styling** | Vanilla CSS Design System | Custom CSS tokens, fluid typography, dark navy & collegiate blue |
| **Routing** | React Router v7 | Instant scroll-to-top handler + Back/Forward history scroll restoration |
| **Backend** | Spring Boot 3.3.4, Java 21 | Spring Data JPA, Hibernate, HikariCP, Spring Security |
| **Authentication** | Stateless JWT (HS256) | JJWT 0.11.5 with BCrypt hashing |
| **Database** | PostgreSQL (Supabase / H2 Local) | Connection pooler, parameterized queries, pessimistic locking |
| **Media Storage** | Supabase Storage (S3 API) | S3 client integration, MIME validation, auto-cleanup on delete |
| **Icons & UI** | Lucide React | Lightweight SVG icons |

---

## REST API Endpoints

### Public Endpoints (Students & Visitors)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health probe & service readiness status |
| `GET` | `/api/events` | List all visible campus club events |
| `GET` | `/api/events/upcoming` | Retrieve upcoming events (supports `?limit=N`) |
| `GET` | `/api/events/featured` | Retrieve current flagship featured event |
| `GET` | `/api/events/categories` | Retrieve list of available event categories |
| `GET` | `/api/events/{id}` | Get complete details for a single event |
| `POST` | `/api/events/{id}/registrations` | Register a student for an event (rate-limited) |

### Administrative Endpoints (Protected by JWT)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Admin authentication & JWT token generation |
| `GET` | `/api/admin/stats` | Aggregate dashboard statistics & utilization metrics |
| `GET` | `/api/admin/events` | Complete roster of events including closed/past events |
| `POST` | `/api/admin/events` | Create a new event |
| `PUT` | `/api/admin/events/{id}` | Update existing event details and capacities |
| `DELETE` | `/api/admin/events/{id}` | Delete event, registrations, and associated S3 image |
| `POST` | `/api/admin/events/upload-image` | Upload event banner image to Supabase S3 bucket |
| `GET` | `/api/admin/registrations` | View all registrations (supports filtering by event or year) |
| `DELETE` | `/api/admin/registrations/{id}` | Cancel/delete an attendee registration |

---

## Environment Configuration Reference

The application works out of the box with sensible defaults (including local H2 database mode if Supabase credentials are not provided).

For production or cloud deployment, environment variables can be configured using [`.env.example`](file:///.env.example) as a guide:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `8080` |
| `DATABASE_URL` | PostgreSQL connection pool URL | `postgresql://user:pass@host:5432/postgres` |
| `JWT_SECRET` | 256-bit secret key for signing admin JWTs | Strong random key (32+ chars) |
| `JWT_EXPIRATION_MS` | Lifetime of admin session token | `86400000` (24 hours) |
| `ADMIN_USERNAME` | Default administrative account username | `admin@gmail.com` |
| `ADMIN_PASSWORD` | Default administrative account password | `admin` |
| `SUPABASE_S3_ENDPOINT` | Supabase S3 storage endpoint URL | `https://<ref>.storage.supabase.co/storage/v1/s3` |
| `SUPABASE_STORAGE_BUCKET` | Destination S3 bucket name | `SDMS` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed web origins | `http://localhost:5173` |
| `VITE_API_URL` | Frontend API client base URL | `http://localhost:8080/api` |

---

### Built with care for college clubs, student innovators, and campus communities.
