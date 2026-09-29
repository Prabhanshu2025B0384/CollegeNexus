# 🎓 Campus Nexus — College Club Event Management Platform

A complete, full-stack event management web application engineered for college clubs, student chapters, and university organizations. It provides a public-facing portal for students to browse and register for events, alongside an administrative dashboard for organizers to manage events and student attendee rosters.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [What the Application Does](#2-what-the-application-does)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Prerequisites](#6-prerequisites)
7. [Step-by-Step Local Setup Guide](#7-step-by-step-local-setup-guide)
   - [STEP 1 — Install Prerequisites](#step-1--install-prerequisites)
   - [STEP 2 — Create Your Supabase PostgreSQL Database](#step-2--create-your-supabase-postgresql-database)
   - [STEP 3 — Configure Environment Variables](#step-3--configure-environment-variables)
   - [STEP 4 — Run with One-Click `start.bat`](#step-4--run-with-one-click-startbat)
   - [STEP 5 — Stop with `stop.bat`](#step-5--stop-with-stopbat)
8. [Database & Seed Data (Dummy Data)](#8-database--seed-data-dummy-data)
9. [Admin Login & Authentication](#9-admin-login--authentication)
10. [Application Routes (Student & Admin)](#10-application-routes-student--admin)
11. [REST API Documentation](#11-rest-api-documentation)
12. [Security Architecture](#12-security-architecture)
13. [Deployment to Production](#13-deployment-to-production)
    - [Deploy Backend to Render](#a-deploy-spring-boot-backend-to-render)
    - [Deploy Frontend to Vercel](#b-deploy-react-frontend-to-vercel)
    - [Configuring CORS in Production](#c-configuring-cors-in-production)
14. [Troubleshooting & Common Mistakes](#14-troubleshooting--common-mistakes)
15. [Future Improvements](#15-future-improvements)

---

## 1. Project Overview

Campus Nexus empowers student organizations to organize and broadcast events across campus. It replaces disjointed spreadsheets and Google Forms with a unified, database-driven platform featuring real-time registration tracking, capacity limits, and duplicate-entry prevention.

---

## 2. What the Application Does

### 🧑‍🎓 Student / Public Portal:
* **Club Homepage:** Learn about club activities, view key statistics, and explore what students gain.
* **Spotlight Featured Event:** Discover the primary event of the month dynamically served from the database.
* **Upcoming Events Carousel & Grid:** Browse events sorted by date with visual category badges.
* **Event Search & Filtering:** Search events by keyword/venue and filter by categories (*Technical, Workshop, Hackathon, Cultural, Sports, Literary, Gaming, Career, Seminar, Competition*).
* **Event Details Page:** View complete descriptions, time schedules, venues, and seat availability.
* **One-Click Registration:** Enter student details (*Name, Email, College, Academic Year, Phone*) with immediate confirmation and duplicate registration prevention.

### 🛡️ Admin Management Portal:
* **Secure Admin Authentication:** Spring Security with BCrypt password hashing and stateless JWT tokens.
* **Executive Dashboard:** Live metrics displaying total events, upcoming events, total registrations, and current featured event.
* **Full Event CRUD:** Create, edit, and delete events with date pickers, capacity settings, category selectors, and safe deletion confirmations.
* **Registration Roster:** Inspect all participant submissions, search by student name/email/college, filter by event or academic year, and export attendee rosters directly to CSV.

---

## 3. Architecture Diagram

```text
                 ┌────────────────────────────────┐
                 │         Student / Admin        │
                 │          Web Browser           │
                 └───────────────┬────────────────┘
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │       React 19 + Vite + TS     │
                 │         Frontend App           │
                 │   (Hosted on Vercel / Local)   │
                 └───────────────┬────────────────┘
                                 │
                                 │ HTTP REST Requests
                                 │ Bearer JWT (Admin)
                                 ▼
                 ┌────────────────────────────────┐
                 │       Spring Boot 3.3 API      │
                 │       (Java 21 / Maven)        │
                 │   (Hosted on Render / Local)   │
                 └───────────────┬────────────────┘
                                 │
                                 │ JDBC / TLS
                                 ▼
                 ┌────────────────────────────────┐
                 │       Supabase PostgreSQL      │
                 │        Cloud Database          │
                 └────────────────────────────────┘
```

---

## 4. Technology Stack

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, React Router 7, Lucide Icons | Responsive single-page application with custom CSS design tokens |
| **Backend** | Java 21, Spring Boot 3.3.4, Spring Data JPA, Spring Security, Bean Validation | Clean layered REST architecture (Controller → Service → Repository → Entity) |
| **Database** | PostgreSQL (Supabase) | Cloud-hosted relational database with relational constraints and indexing |
| **Security** | JWT (jjwt 0.11.5), BCrypt | Stateless token-based security and password encryption |
| **Build Tools** | Maven 3.9 (Maven Wrapper included `mvnw`), npm | Independent build scripts for zero-conflict portability |

---

## 5. Project Structure

```text
EventMangement/
├── backend/                             # Spring Boot Java Application
│   ├── .mvn/wrapper/                    # Bundled Maven Wrapper (no local Maven install needed)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/college/club/
│   │   │   │   ├── CollegeClubApplication.java
│   │   │   │   ├── config/              # CORS config & safe DataInitializer
│   │   │   │   ├── controller/          # REST controllers (Public & Admin)
│   │   │   │   ├── dto/                 # Request & response data transfer objects
│   │   │   │   ├── entity/              # JPA entities (User, Event, Registration)
│   │   │   │   ├── exception/           # Safe global exception handling
│   │   │   │   ├── repository/          # Spring Data JPA repositories
│   │   │   │   ├── security/            # JWT utility, auth filter, security config
│   │   │   │   └── service/             # Business logic & transaction management
│   │   │   └── resources/
│   │   │       ├── application.properties # Environment-driven properties
│   │   │       └── schema.sql           # Reference PostgreSQL DDL script
│   │   └── test/
│   ├── pom.xml                          # Maven dependencies
│   ├── mvnw & mvnw.cmd                  # Maven wrapper executable scripts
│   └── .env.example                     # Backend environment template
│
├── frontend/                            # React + Vite TypeScript Application
│   ├── src/
│   │   ├── components/                  # Navbar, Footer, EventCard, Modals, etc.
│   │   ├── context/                     # AuthContext for admin state
│   │   ├── pages/                       # Home, Events, Details, Admin pages
│   │   ├── services/                    # Centralized API service layer
│   │   ├── types/                       # TypeScript interfaces
│   │   ├── App.tsx                      # Application routing
│   │   ├── index.css                    # Design system tokens and styles
│   │   └── main.tsx                     # React DOM entry point
│   ├── index.html                       # HTML head with fonts and SEO metadata
│   ├── package.json                     # Frontend dependencies
│   ├── tsconfig.json                    # TypeScript compiler configuration
│   ├── vite.config.ts                   # Vite configuration
│   ├── vercel.json                      # Vercel SPA routing rewrite config
│   └── .env.example                     # Frontend environment template
│
├── start.bat                            # Windows one-click local startup script
├── stop.bat                             # Windows one-click local shutdown script
├── .gitignore                           # Git ignore rules for node, java, env
├── .env.example                         # Master environment reference
└── README.md                            # Comprehensive project guide
```

---

## 6. Prerequisites

To run this application locally, you only need:
1. **Java Development Kit (JDK) 21** or later. Check with `java -version`.
2. **Node.js 20+** and **npm**. Check with `node -v` and `npm -v`.
3. A free **Supabase** account (for your cloud PostgreSQL database).

*(Note: You do not need to install Maven globally; the project includes `mvnw.cmd` automatically).*

---

## 7. Step-by-Step Local Setup Guide

### STEP 1 — Install Prerequisites
* Download JDK 21: [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/#java21) or [Eclipse Adoptium Temurin 21](https://adoptium.net/).
* Download Node.js: [Node.js Official Website](https://nodejs.org/).

### STEP 2 — Create Your Supabase PostgreSQL Database
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project** and choose a name (e.g. `college-club-events`).
3. Set a strong database password (store this somewhere safe).
4. Once the project finishes provisioning (about 1 minute):
   - Go to **Project Settings** (gear icon) ➔ **Database**.
   - Scroll down to **Connection String** ➔ Select the **URI** tab.
   - It will look like this:
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - For Java JDBC, replace the protocol with `jdbc:postgresql://` and add `?sslmode=require` at the end:
     ```text
     jdbc:postgresql://aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
     ```

### STEP 3 — Configure Environment Variables

#### Backend Configuration:
Create a `.env` file in the `backend/` folder (or copy `backend/.env.example`):
```env
PORT=8080

# The 4 Supabase Core Values
SUPABASE_URL=https://vshsmnrzeusimlcemzhc.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=SDMS
DATABASE_URL=postgresql://postgres.vshsmnrzeusimlcemzhc:your_password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

# Security & CORS
JWT_SECRET=superSecretRandomStringWithAtLeast32Characters12345!
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Admin Credentials
ADMIN_USERNAME=admin@gmail.com
ADMIN_PASSWORD=admin
ADMIN_EMAIL=admin@collegeclub.edu
```

#### Frontend Configuration:
Create a `.env` file in the `frontend/` folder (created automatically on startup):
```env
VITE_API_URL=http://localhost:8080/api
```

### STEP 4 — Run with One-Click `start.bat`
On Windows, double-click:
```cmd
start.bat
```
This script will:
1. Launch the Spring Boot backend on `http://localhost:8080`.
2. Launch the Vite React frontend on `http://localhost:5173`.
3. Automatically open your browser to `http://localhost:5173`.

> **Alternatively (Manual Startup):**
> * Terminal 1 (Backend):
>   ```bash
>   cd backend
>   .\mvnw.cmd spring-boot:run
>   ```
> * Terminal 2 (Frontend):
>   ```bash
>   cd frontend
>   npm run dev
>   ```

### STEP 5 — Stop with `stop.bat`
To cleanly shut down both servers without leaving background ports occupied, double click:
```cmd
stop.bat
```

---

## 8. Database & Seed Data (Dummy Data)

When the backend connects to your Supabase PostgreSQL database for the first time, Spring Boot's JPA will automatically create the tables:
1. `users` — Admin and staff credentials.
2. `events` — Event details, schedules, capacities, and flags.
3. `registrations` — Student registrations with unique constraint on `(event_id, email)`.

### Idempotent Automatic Seeding
The backend includes a `DataInitializer` that checks table counts before writing data:
* **Admin User:** If 0 users exist, it creates the default admin user.
* **10 Realistic Club Events:** If 0 events exist, it seeds 10 diverse events across categories (*Nexus Hackathon 2026, Full-Stack Mastery, Cloud & DevOps, Aura Cultural Fest, Cricket Tournament, ByteBattle Coding Challenge, Tech Horizons Mentorship, National Youth Debate, Apex Gaming Cup, and Web3 Seminar*).
* **Sample Registrations:** Seeds realistic sample student registrations for immediate preview.
* **Safe Restarting:** If you restart the server, existing records are detected and duplicate seeding is skipped.

---

## 9. Admin Login & Authentication

To log into the administrator portal:
1. Click **Admin Portal** in the top navigation bar or navigate to:
   ```text
   http://localhost:5173/admin/login
   ```
2. Enter the credentials defined in your backend `.env`:
   * **Username:** `admin`
   * **Password:** `Admin@12345` (or your configured `ADMIN_PASSWORD`)
3. Upon authentication, a stateless JWT token is returned and stored in `localStorage`, granting access to `/admin/dashboard`, `/admin/events`, and `/admin/registrations`.

---

## 10. Application Routes (Student & Admin)

### Student Routes:
* `/` — Homepage with Hero, Featured Event spotlight, upcoming events grid, and club introduction.
* `/events` — Searchable and category-filterable directory of all club events.
* `/events/:id` — Dedicated event details page with full description, schedule, and direct registration modal.

### Administrator Routes:
* `/admin/login` — Administrative authentication portal.
* `/admin/dashboard` — Live dashboard with high-level statistics and quick management shortcuts.
* `/admin/events` — Event management table with Add, Edit, and Delete actions.
* `/admin/registrations` — Attendee registration table with search, event filters, academic year filters, and CSV export.

---

## 11. REST API Documentation

### Public Endpoints:
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/events` | List all events (supports `?search=...` and `?category=...`) |
| `GET` | `/api/events/{id}` | Get event details by ID |
| `GET` | `/api/events/featured` | Get current primary featured event |
| `GET` | `/api/events/upcoming` | Get upcoming events (`?limit=6`) |
| `GET` | `/api/events/categories` | Get unique list of existing categories |
| `POST` | `/api/events/{id}/registrations` | Register student for an event |

### Authentication Endpoints:
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login with username and password, returns JWT |
| `GET` | `/api/auth/me` | Get profile of authenticated user |

### Admin Endpoints (Require `Authorization: Bearer <TOKEN>`):
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard/stats` | Aggregated dashboard metrics |
| `GET` | `/api/admin/events` | List events with attendee counts |
| `POST` | `/api/admin/events` | Create a new event |
| `PUT` | `/api/admin/events/{id}` | Update existing event |
| `DELETE` | `/api/admin/events/{id}` | Delete event (cascades associated registrations) |
| `GET` | `/api/admin/registrations` | Search and filter registrations (`?search=...&eventId=...&year=...`) |
| `DELETE` | `/api/admin/registrations/{id}` | Remove single registration record |

---

## 12. Security Architecture

1. **Password Hashing:** Passwords are encrypted with standard `BCryptPasswordEncoder` (never stored in plaintext).
2. **Stateless JWT Tokens:** Authentication uses HMAC-SHA256 tokens signed with `JWT_SECRET`. Tokens expire automatically after 24 hours (`JWT_EXPIRATION_MS`).
3. **Server-Side Authorization:** Admin endpoints under `/api/admin/**` strictly enforce `ROLE_ADMIN` server-side via `SecurityConfig`. Frontend UI gating is strictly for UX.
4. **Input Validation:** All registration requests undergo server-side Bean Validation (`@NotBlank`, `@Email`, regex phone checks).
5. **Duplicate Registration Prevention:** Database-enforced unique constraint on `(event_id, email)` prevents spam or double submissions.
6. **SQL Injection Defense:** Built completely on Spring Data JPA parameterized queries and Criteria API.
7. **Safe Error Handling:** `GlobalExceptionHandler` formats all errors into clean JSON payloads without leaking internal database errors or stack traces.

---

## 13. Deployment to Production

### A. Deploy Spring Boot Backend to Render
1. Create a free account on [render.com](https://render.com).
2. Click **New +** ➔ **Web Service** and connect your GitHub repository.
3. Configure the service:
   * **Root Directory:** `backend`
   * **Runtime:** `Java` (or Docker)
   * **Build Command:** `./mvnw clean package -DskipTests`
   * **Start Command:** `java -jar target/event-management-backend-1.0.0.jar`
4. In the **Environment Variables** section on Render, add:
   * `DB_URL` = Your Supabase JDBC URI (`jdbc:postgresql://...`)
   * `DB_USERNAME` = `postgres.YOUR_PROJECT_REF`
   * `DB_PASSWORD` = Your Supabase DB password
   * `JWT_SECRET` = A strong random 32+ character key
   * `CORS_ALLOWED_ORIGINS` = Your Vercel frontend URL (e.g. `https://college-club.vercel.app`)
   * `ADMIN_USERNAME` = Your production admin username
   * `ADMIN_PASSWORD` = A strong production admin password
5. Click **Create Web Service**. Render will assign a public URL (e.g. `https://college-club-backend.onrender.com`).

---

### B. Deploy React Frontend to Vercel
1. Create a free account on [vercel.com](https://vercel.com).
2. Click **Add New Project** and import your GitHub repository.
3. Configure settings:
   * **Root Directory:** Select `frontend`
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. In the **Environment Variables** section on Vercel, add:
   * `VITE_API_URL` = `https://college-club-backend.onrender.com/api` (your deployed Render API URL)
5. Click **Deploy**. Vercel will build and launch your site with a custom `.vercel.app` URL.

---

### C. Configuring CORS in Production
Once your Vercel frontend is deployed:
1. Go back to your Render Dashboard ➔ Environment Variables.
2. Update `CORS_ALLOWED_ORIGINS` to match your Vercel URL:
   ```env
   CORS_ALLOWED_ORIGINS=https://your-club-app.vercel.app
   ```
3. Save changes. Render will automatically redeploy with the updated CORS policy.

---

## 14. Troubleshooting & Common Mistakes

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **Backend fails to connect to database** | Missing or incorrect Supabase credentials in `backend/.env` | Verify your Supabase DB password and ensure `?sslmode=require` is present at the end of `DB_URL`. |
| **`mvn` is not recognized error** | Maven is not installed in Windows PATH | Run `start.bat` or use `.\mvnw.cmd spring-boot:run` in the `backend/` directory. |
| **Frontend displays "Unable to connect to the server"** | Backend is not running or `VITE_API_URL` is mismatched | Ensure backend is running on port 8080 and `frontend/.env` has `VITE_API_URL=http://localhost:8080/api`. |
| **CORS blocked by browser** | Frontend origin is not listed in `CORS_ALLOWED_ORIGINS` | Check `backend/.env` and ensure `http://localhost:5173` is included. |
| **Admin login says "Invalid credentials"** | Using wrong password or default was changed | Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env`. Default is `admin` / `Admin@12345`. |
| **Refreshing page on Vercel returns 404** | Single-page application routes not rewritten to `index.html` | The repository already includes `frontend/vercel.json` with rewrite rules to prevent this. |

---

## 15. Future Improvements

* Email confirmation notifications using SendGrid or AWS SES upon registration.
* QR Code generation on event registration confirmation for fast campus check-in.
* Multiple user permission tiers (e.g. Faculty Advisor vs. Student Organizer).
* Calendar integration (.ics export to Google Calendar and Apple Calendar).

---

&copy; 2026 Campus Nexus College Club. Built for collegiate innovation.
