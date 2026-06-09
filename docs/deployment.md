# Free Deployment Guide (Zero Cost, Zero Downtime)

Hosting a full-stack application with a backend server, background queues (BullMQ), and database services completely for free without cold-start downtime is possible using a combination of modern serverless providers and a keep-alive monitor.

> [!NOTE]
> If you are deploying the entire stack (including PostgreSQL and Redis) directly on **Render**, see the dedicated **[Render Full-Stack Deployment Guide](file:///Users/atulraina/Desktop/Mail_Agent/docs/render-deployment.md)**.

---

## 1. Architecture Overview

To achieve a 100% free tier deployment:
```
[Frontend (React)] ----> [Vercel or Cloudflare Pages] (Free, CDN, 0 Downtime)
       |
       v
[Backend API (NestJS)] -> [Render or Koyeb] (Free Docker/Node App + UptimeRobot keep-alive)
       |
       +---> [Database (Postgres)] -> [Supabase or Neon.tech] (Free Serverless DB)
       |
       +---> [Queue (Redis)] -------> [Upstash Redis] (Free Serverless Redis)
```

---

## 2. Recommended Free Providers

### Database: PostgreSQL
* **Neon.tech:** Generous free tier (0.5 GiB storage, unlimited connections, instant branching). Excellent serverless performance.
* **Supabase:** Offers 2 free database projects with full Postgres access.

### Queue/Cache: Redis
* **Upstash Redis:** Completely serverless Redis. The free tier gives you **10,000 commands per day**, which is more than enough to handle periodic Gmail sync tasks.

### Frontend: React
* **Vercel:** High-speed global edge network, automatic deployment on every `git push`, completely free for personal use.
* **Cloudflare Pages:** Uncapped bandwidth, excellent load times, and 100% free.

### Backend API: NestJS
* **Render (Free Web Services):**
  - **The Downtime Issue:** Render puts free services to sleep after 15 minutes of inactivity. The next request triggers a "cold start" which takes 30–50 seconds to boot the server.
  - **The 0-Downtime Hack:** Register a free account at **[UptimeRobot](https://uptimerobot.com/)** or **[Cron-Job.org](https://cron-job.org/)**. Configure it to ping your backend API endpoint (e.g. `https://your-app.onrender.com/`) once every **10 minutes**. This continuously triggers activity and keeps the container awake **24/7** with **no cold starts**.
* **Koyeb:** Offers a free micro-instance that runs containers without immediate sleeping rules.

---

## 3. Step-by-Step Deployment Steps

### Step 1: Provision the Database (Supabase / Neon)
1. Register at [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com/).
2. Create a new project named `jaip-db`.
3. Copy the connection string. It will look like:
   `postgresql://username:password@ep-cool-sun-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Step 2: Provision Redis (Upstash)
1. Register at [Upstash](https://upstash.com/).
2. Create a new **Redis Database**.
3. Under the database details, scroll to the **Node.js connection strings** and copy the Redis URL. It will look like:
   `rediss://default:your-password@cool-instance.upstash.io:6379`

### Step 3: Deploy the Backend API (Render)
1. Push your project code to a private GitHub repository.
2. Sign in to [Render](https://render.com/).
3. Click **New > Web Service** and connect your GitHub repository.
4. Set the following settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
5. Click **Advanced** and add the environment variables:
   - `DATABASE_URL` = *(Your Neon/Supabase URL)*
   - `JWT_SECRET` = *(Generate a random string)*
   - `REDIS_URL` = *(Your Upstash Redis URL)*
   - `GEMINI_API_KEY` = *(Your Google AI Studio Key)*
   - `GOOGLE_CLIENT_ID` = *(Your Google Console OAuth ID)*
   - `GOOGLE_CLIENT_SECRET` = *(Your Google Console OAuth Secret)*
6. Click **Deploy Web Service**. Once deployed, copy your service URL (e.g., `https://jaip-api.onrender.com`).

### Step 4: Configure Keep-Alive Monitor
1. Register at [UptimeRobot](https://uptimerobot.com/).
2. Click **Add New Monitor**.
3. Select **Monitor Type:** `HTTP(s)`.
4. **Friendly Name:** `JAIP Backend KeepAlive`.
5. **URL (or IP):** `https://your-render-url.onrender.com` (your backend URL).
6. **Monitoring Interval:** Every `10 minutes`.
7. Click **Create Monitor**.

### Step 5: Deploy the Frontend (Vercel)
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New > Project** and import your GitHub repository.
3. Set the following settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**. Vercel will build your React application and host it on a free, permanent subdomain (e.g., `https://jaip-app.vercel.app`).
