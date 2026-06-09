# Job Application Intelligence Platform (JAIP) - Setup Guide

This document describes how to configure, run, and build the JAIP workspace locally.

---

## 1. Prerequisites

Make sure your machine has the following tools installed:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **Docker & Docker Compose**

---

## 2. Environment Variables Setup

Create a `.env` file inside the `backend/` directory (`backend/.env`).

```ini
# Database Connection (automatically connects to local Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5439/jaip_db?schema=public"

# JWT Authentication secret key (used for signing session tokens)
JWT_SECRET="jaip_jwt_secret_key"

# AI engine key (Get a free API key from Google AI Studio: https://aistudio.google.com)
# If left blank, the system automatically falls back to offline/regex parsing without crashing.
GEMINI_API_KEY="your-gemini-api-key-here"

# Google OAuth Credentials (required for live Gmail synchronization)
# If left blank, you can still test the platform using "Bypass & Simulate Offline Dashboard"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2.1 How to Obtain Google Client ID & Secret

To sync real job search emails from Gmail, you must register a Web Application on the Google Cloud Console:

1. **Go to Google Cloud Console:**
   - Log in to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click the project selector in the header and create a **New Project** (e.g. `JAIP-Sync`).

2. **Configure the OAuth Consent Screen:**
   - In the sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
   - Select **User Type:** `External` and click **Create**.
   - Input your app metadata (e.g. App Name: `JAIP`, Support Email: your email).
   - In the **Scopes** stage, click **Add or Remove Scopes**, and manually add the following scopes:
     - `https://www.googleapis.com/auth/gmail.readonly` (to fetch incoming emails)
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - In the **Test Users** stage, add your personal Gmail address (this is critical so you can log in during development mode).

3. **Create Credentials:**
   - Navigate to **APIs & Services** > **Credentials**.
   - Click **+ Create Credentials** at the top and select **OAuth client ID**.
   - Choose **Application Type:** `Web application`.
   - Set **Name:** `JAIP Local Development`.
   - **Authorized JavaScript origins:**
     - Add `http://localhost:5173`
   - **Authorized redirect URIs:**
     - Add `http://localhost:3000/auth/google/callback`
   - Click **Create**.

4. **Copy Secrets:**
   - Copy the generated **Client ID** and **Client Secret**.
   - Paste them into your `backend/.env` file under `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## 3. Launch Docker Services

JAIP requires **PostgreSQL** and **Redis** to run. Boot them up in the background using Docker Compose:

```bash
# Start Postgres & Redis containers
docker compose up -d

# Verify containers are running
docker compose ps
```
*Note: Redis is mapped to port `6389` instead of `6379` to avoid conflicts with any local Redis instance running on your host system.*

---

## 4. Run Initial Database Migrations

With the Postgres container running, apply the Prisma database schema to generate tables:

```bash
# Run migrations from root
npm run db-migrate
```

---

## 5. Development Command (Single Command Startup)

To start both servers concurrently, run:

```bash
# Run both servers in dev mode
npm run dev
```

Alternatively, you can start frontend or backend separately from the root using these shortcut commands:

```bash
# Start React frontend only
npm run f

# Start NestJS backend only
npm run b
```

- **React Frontend:** Runs at `http://localhost:5173`
- **NestJS Backend:** Runs at `http://localhost:3000`

### Offline Development & Evaluation
If you do not have Google OAuth credentials ready:
1. Open `http://localhost:5173` in your browser.
2. Click **Bypass & Simulate Offline Dashboard**. This logs you in with a mock account.
3. Click **Sync Gmail** in the top-right header. The system will detect no tokens and run the high-fidelity simulator, creating mock job applications, interview timelines, offers, and classification logs for Google, Vercel, and Stripe.

---

## 6. Production Build & Execution

To compile and build the entire workspace for production:

```bash
# Build both frontend and backend
npm run build

# Start the production servers
# Backend (port 3000)
npm run start:backend

# Frontend preview (port 5173)
npm run start:frontend
```

---

## 7. Developer Utilities

- **Prisma Studio:** To explore raw database tables inside a clean web GUI:
  ```bash
  npm run db:studio
  ```
- **Stop Containers:**
  ```bash
  docker compose down
  ```





i mean what i need to  say on render for forntend deployment what i paste in ind etauls rrot src and so and in envs 
22:30
Here is exactly what you should fill in for the Frontend Static Site deployment screen on Render:

1. Build & Deploy Settings
Branch: main
Root Directory: frontend (Make sure to write exactly frontend with no spaces!)
Build Command: Replace the default with:
bash
npm run build
Publish Directory: Replace the default with:
text
r
2. Environment Variables
Click Add Environment Variable (or Add from .env) and add this single variable:

Key (Name): VITE_API_URL
Value: https://your-backend-name.onrender.com (Replace this with the actual URL of your backend Render service)