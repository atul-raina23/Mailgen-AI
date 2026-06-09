# Render Full-Stack Deployment Guide (Step-by-Step)

This guide provides step-by-step instructions to deploy the **Job Application Intelligence Platform (JAIP)** on **Render**, including setting up the managed database, queue server, backend, and frontend.

---

## 1. Managed Databases on Render

We must provision the databases (PostgreSQL and Redis) on Render first so that their connection credentials can be injected into the backend service.

### A. Setting Up Managed PostgreSQL
Render offers fully managed PostgreSQL instances.
1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** (top-right) and select **PostgreSQL**.
3. Configure the database settings:
   - **Name**: `jaip-db`
   - **Database Name**: `jaip_db`
   - **User**: `postgres`
   - **Region**: Select the region closest to you or your target audience (e.g., *US Oregon*).
   - **Instance Type**: Select the **Free** tier (Note: Render Free Databases expire after 90 days).
4. Click **Create Database**.
5. Once active, locate the **Connections** panel:
   - **Internal Database URL**: This is used for backend communication *inside* the Render network.
     *Example:* `postgresql://postgres:password@dpg-xxxxxx-a.oregon-postgres.render.com/jaip_db`
   - **External Database URL**: This is used to connect from your local machine to run Prisma migrations.
     *Example:* `postgresql://postgres:password@dpg-xxxxxx-a.oregon-postgres.render.com/jaip_db?ssl=true`

### B. Setting Up Managed Redis
Render offers managed Redis instances for caching and background queues (like BullMQ).
1. Click **New +** in the Render Dashboard and select **Redis**.
2. Configure the Redis settings:
   - **Name**: `jaip-redis`
   - **Region**: **CRITICAL** - Select the **exact same region** as your PostgreSQL database to minimize latency.
   - **Instance Type**: Select the **Free** tier.
   - **Maxmemory Policy**: Leave as default (`noeviction`).
3. Click **Create Redis**.
4. Once active, locate the connection credentials:
   - **Internal Redis Connection String**: This is used by your backend service to communicate with Redis.
     *Example:* `redis://red-xxxxxxxxxx:6379`
   - **External Redis Connection String**: This is used if you want to inspect/connect to Redis from your local machine.
     *Example:* `rediss://red-xxxxxxxxxx@external-redis.render.com`

---

## 2. Deploying NestJS Backend

The backend is deployed as a Render **Web Service**.

### A. Configuration
1. Click **New +** in the Render Dashboard and select **Web Service**.
2. Connect your GitHub repository containing the JAIP codebase.
3. Configure the service parameters:
   - **Name**: `jaip-backend`
   - **Region**: Select the **same region** as your database and Redis.
   - **Branch**: `main` (or your active release branch)
   - **Root Directory**: `backend` (Ensure this is set so Render runs commands relative to the backend directory)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: Select the **Free** tier.

### B. Environment Variables to Configure
Go to the **Environment** tab in your NestJS Web Service dashboard and add the following keys and values:

| Environment Key | Value / Source | Description |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | *[Render Internal Database URL]* | Copy the **Internal Database URL** from your Render PostgreSQL instance. |
| **`REDIS_URL`** | *[Render Internal Redis Connection String]* | Copy the **Internal Redis Connection String** from your Render Redis instance. |
| **`JWT_SECRET`** | *[A secure random string]* | Any long random cryptographic key for session token signing. |
| **`GEMINI_API_KEY`** | *[Your Gemini Key]* | Obtain for free from [Google AI Studio](https://aistudio.google.com/). |
| **`GOOGLE_CLIENT_ID`** | *[Your Google Client ID]* | Client ID created in your Google Cloud Console for Gmail OAuth. |
| **`GOOGLE_CLIENT_SECRET`** | *[Your Google Client Secret]* | Client Secret created in your Google Cloud Console for Gmail OAuth. |
| **`PORT`** | `3000` | Port the backend NestJS app will bind to. Render routes external HTTP traffic here. |

### C. Running Database Migrations
Before the backend can successfully start and query the database, you must push your Prisma schema to Render's PostgreSQL instance. Since Render blocks external access except via the External Database URL, run this command from your local machine:

```bash
DATABASE_URL="[YOUR_EXTERNAL_DATABASE_URL_FROM_RENDER]" npm run db:migrate
```

---

## 3. Deploying React Frontend

The React frontend is deployed as a Render **Static Site**.

### A. Configuration
1. Click **New +** in the Render Dashboard and select **Static Site**.
2. Connect your GitHub repository.
3. Configure the static site settings:
   - **Name**: `jaip-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Instance Type**: Free tier.

### B. Environment Variables to Configure
Because React runs inside the client's browser, environment variables starting with `VITE_` must be defined during the *build phase* so Vite can bundle them into the static files.

Go to the **Environment** tab in your React Static Site dashboard and add:

| Environment Key | Value / Source | Description |
| :--- | :--- | :--- |
| **`VITE_API_URL`** | `https://jaip-backend.onrender.com` | The public URL generated by Render for your backend Web Service. **Do not add a trailing slash.** |

> [!WARNING]
> If you ever update the backend URL or change `VITE_API_URL`, you must click **Manual Deploy > Clear Cache & Deploy** on the static site dashboard to rebuild the React bundle with the new URL.

---

## 4. Keeping Render Free Tier Active (0 Downtime Hack)

Render puts Free tier instances to sleep after **15 minutes** of inactivity. The first visitor after sleep will experience a delay of **30–50 seconds** (cold start) while the container wakes up.

To keep your backend active 24/7 at no cost:
1. Register a free account at [UptimeRobot](https://uptimerobot.com/) or [Cron-Job.org](https://cron-job.org/).
2. Create a new **HTTP(s) Monitor**.
3. Set the following settings:
   - **Friendly Name**: `JAIP Backend Keep-Alive`
   - **URL**: `https://jaip-backend.onrender.com/` (Replace with your backend's actual Render URL)
   - **Interval**: Every `10 minutes` (This prevents the 15-minute sleep timer from triggering).
4. Save and start the monitor.

Your application will now stay active and responsive with zero cold starts!
