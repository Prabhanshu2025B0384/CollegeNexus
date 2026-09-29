# Campus Nexus — Production Deployment Guide

This guide walks you through deploying **Campus Nexus** to production using:
- **Database & Storage:** Supabase (Managed PostgreSQL & S3-compatible Object Storage)
- **Backend API:** Render (Spring Boot 3.3.4 / Java 21 Web Service)
- **Frontend:** Vercel (React 19 / Vite / TypeScript Single Page Application)

---

## Architecture Overview

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

---

## Part A — Supabase (Database & Storage)

### 1. Create Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **New Project**, select your organization, name it (e.g. `campus-nexus`), and choose a geographic region close to your Render deployment (e.g. `ap-southeast-1` or `us-east-1`).
3. Set a strong database password and **save it securely**.

### 2. Obtain PostgreSQL Connection URI (`DATABASE_URL`)
1. In your Supabase project dashboard, navigate to **Project Settings** (gear icon) → **Database**.
2. Scroll to the **Connection string** section.
3. Select the **URI** tab.
4. Choose **Transaction Pooler** (recommended for serverless/cloud containers) or **Session Pooler**:
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
5. Replace `[YOUR_PASSWORD]` with your actual database password.
   > **Note:** If your password contains special characters (e.g., `#`, `@`, `%`), the backend automatically URL-decodes it safely during connection initialization.

### 3. Create Storage Bucket (for Event Banners)
1. In Supabase, go to **Storage** → **New Bucket**.
2. Name the bucket: `SDMS` (or any custom name; default is `SDMS`).
3. Toggle **Public bucket** to `ON` so that uploaded event banner images are publicly accessible via CDN.
4. Click **Save**.

### 4. Obtain Supabase Service Key
1. Go to **Project Settings** → **API**.
2. Copy the **Project URL** (e.g. `https://[PROJECT_REF].supabase.co`).
3. Under **Project API keys**, copy the `service_role` (secret) key.
   > **CRITICAL SECURITY NOTE:** Never share or commit the `service_role` key. It must only be configured as a secret environment variable on Render, never in the frontend.

### 5. (Optional) Manual Sample Data Seeding
By default, Campus Nexus **never** pollutes your empty production database with fake events or fake registrations (`app.seed.sample-data=false`).
If you wish to seed demo events in a staging/testing database:
1. Open Supabase **SQL Editor**.
2. Open [`backend/src/main/resources/sample-seed.sql`](file:///c:/Users/idonp/OneDrive/Desktop/EventMangement/backend/src/main/resources/sample-seed.sql).
3. Paste and click **Run**. This script is idempotent and will safely populate 10 realistic sample events.

---

## Part B — Render (Spring Boot Backend API)

### 1. Create Web Service
1. Log in to [Render](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `campus-nexus-api` (or your preferred name) |
| **Region** | Same region as Supabase (e.g. `Singapore` or `Oregon`) |
| **Root Directory** | `backend` |
| **Runtime** | `Java` |
| **Build Command** | `./mvnw clean package -DskipTests` |
| **Start Command** | `java -jar target/app.jar` |
| **Instance Type** | Free / Starter |

### 2. Configure Environment Variables on Render
Under the **Environment** tab of your Web Service, add the following minimum environment variables:

| Variable Name | Required? | Description / Format | Secret? |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://postgres.[REF]:[PASS]@[HOST]:5432/postgres` | **YES** |
| `JWT_SECRET` | **Yes** | Random 32+ character string (256-bit key) for HMAC-SHA256 signing | **YES** |
| `CORS_ALLOWED_ORIGINS` | **Yes** | Your Vercel frontend URL, e.g. `https://campus-nexus.vercel.app` (comma-separated if multiple) | No |
| `ADMIN_PASSWORD` | **Yes** | Secure password for initial admin user creation on first boot | **YES** |
| `ADMIN_USERNAME` | No (default: `admin@gmail.com`) | Username for administrative login | No |
| `SUPABASE_SERVICE_KEY` | Conditional | Required only if event banner image uploads to Supabase Storage are used | **YES** |
| `PORT` | Auto | Render injects this automatically (defaults to `8080`) | No |
| `SEED_SAMPLE_DATA` | No (default: `false`) | Keep `false` in production to prevent fake dummy data | No |

> **Note on `SUPABASE_URL`:** The backend automatically derives `SUPABASE_URL` from your `DATABASE_URL` host/username (`https://[PROJECT_REF].supabase.co`). You do not need to configure it manually unless using a custom domain.

### 3. Health Check
In Render Web Service settings under **Advanced** → **Health Check Path**, enter:
```
/api/health
```
Render will probe this endpoint for zero-downtime deployments.

### 4. Deploy and Verify
1. Click **Create Web Service**.
2. Monitor deployment logs. You should see:
   - Maven compiling and packaging `target/app.jar`
   - Tomcat starting on port injected by Render
   - `Admin user '...' successfully seeded.`
   - `Sample event/registration seeding is disabled (app.seed.sample-data=false). Production database will remain unpolluted.`
3. Once deployed, note your Render service URL (e.g. `https://campus-nexus-api.onrender.com`).
4. Verify by visiting `https://campus-nexus-api.onrender.com/api/health` in your browser. Expected response:
   ```json
   {"status":"UP","service":"campus-nexus-api"}
   ```

---

## Part C — Vercel (React Frontend)

### 1. Import Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your `EventMangement` repository.

### 2. Configure Project Settings
In the Vercel project configuration screen:

| Setting | Value |
| :--- | :--- |
| **Framework Preset** | `Vite` |
| **Root Directory** | Click Edit and select `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 3. Configure Environment Variables
Under **Environment Variables**, add the single safe frontend variable:

| Variable Name | Required? | Value | Secret? |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** | `https://[YOUR_RENDER_APP].onrender.com/api` | **NO** (Public) |

> **IMPORTANT:** Never add database passwords, JWT secrets, or Supabase service keys to Vercel environment variables. Only public `VITE_` variables belong on the frontend.

### 4. Deploy and Verify
1. Click **Deploy**.
2. Vercel will build TypeScript and Vite assets, placing them in `dist/`.
3. SPA routing is already configured via [`frontend/vercel.json`](file:///c:/Users/idonp/OneDrive/Desktop/EventMangement/frontend/vercel.json) rewrite rule:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
4. Once deployed, visit your assigned Vercel URL (e.g. `https://campus-nexus.vercel.app`).

---

## Part D — Connect Frontend & Backend (CORS & API Synchronization)

To ensure seamless bidirectional communication:

1. **Copy your assigned Vercel URL** (e.g. `https://campus-nexus.vercel.app`).
2. Go to **Render** → your Web Service → **Environment**.
3. Set `CORS_ALLOWED_ORIGINS` to:
   ```
   https://campus-nexus.vercel.app
   ```
   *(If testing locally simultaneously, you can use comma-separated origins: `https://campus-nexus.vercel.app,http://localhost:5173`)*
4. Save changes on Render. Render will perform a quick rolling update with the new CORS origin.

---

## Part E — Production Smoke Test Checklist

Once both services are deployed, perform this verification checklist:

### Public Student Portal
- [ ] **Home Page:** Opens cleanly with modern hero section, featured event card, and navigation bar.
- [ ] **Events Catalog:** `/events` loads events, search bar filters by keyword, category pill badges filter by category (All, Hackathon, Workshop, etc.).
- [ ] **Event Details:** Clicking an event opens `/events/:id` with complete details, date/time, venue, capacity bar, and "Register for Event" CTA.
- [ ] **Student Registration:** Click "Register", fill in Student Name, Email, College, Year, and Phone. Submit registration. Verify success modal appears.
- [ ] **Duplicate Prevention:** Try registering again with the same email. Verify clean error alert: "A registration with this email already exists for this event."
- [ ] **Mobile & Tablet:** Verify responsive drawer menu, touch-friendly buttons, and zero horizontal scrolling on mobile viewports.

### Admin Dashboard
- [ ] **Admin Login:** Navigate to `/admin` or click "Admin Login". Enter configured `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Verify successful redirection to `/admin/dashboard`. Notice default credentials hint is hidden in production.
- [ ] **Analytics Overview:** Verify stat cards (Total Events, Active Events, Total Registrations, Capacity Utilization).
- [ ] **Create Event:** Click "Add Event", fill out details (Title, Date, Time, Venue, Category, Max Capacity). Submit and verify it appears in catalog.
- [ ] **Edit Event:** Modify event capacity or timing; verify immediate update.
- [ ] **Registrations View:** Navigate to `/admin/registrations`. Search for student names, filter by college/year. Verify all registration details are properly laid out.
- [ ] **Logout:** Click "Sign Out". Verify token is cleared and session ends securely.
