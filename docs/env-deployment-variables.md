# Deployment Environment Variables Reference

This guide provides the exact list of environment variables you need to configure in **Render** (for the backend) and **Vercel** (for the frontend).

---

## 1. Backend Environment Variables (Configured on Render)

When deploying the NestJS API on Render, navigate to your Web Service dashboard, click **Environment**, and add the following keys:

| Environment Key | Value Example | Source / Description |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | `postgresql://postgres.xxxxxx.supabase.co:5432/postgres?sslmode=require` | **PostgreSQL Connection URL.** Copy this from your Neon.tech or Supabase database dashboard. Ensure you append `?sslmode=require` at the end. |
| **`REDIS_URL`** | `rediss://default:xxxxxx@cool-instance.upstash.io:6379` | **Redis Connection URL.** Copy the connection string from your Upstash console. *Note: Use `rediss://` (secure) for Upstash.* |
| **`JWT_SECRET`** | `a9f84b39d10e82c5f1a7d65b321...` | **Session Cryptography Secret.** Type any long, random, secure string here. |
| **`GEMINI_API_KEY`** | `AIzaSyxxxxxxxxxxxxxxxxx` | **Gemini AI API Key.** Obtain this for free from [Google AI Studio](https://aistudio.google.com/). |
| **`GOOGLE_CLIENT_ID`** | `123456-xxxxxx.apps.googleusercontent.com` | **Google OAuth Client ID.** Obtained from your Google Cloud Console project credential window. |
| **`GOOGLE_CLIENT_SECRET`** | `GOCSPX-xxxxxxxxxxxxxxxxx` | **Google OAuth Client Secret.** Obtained from your Google Cloud Console project credential window. |
| **`PORT`** | `3000` | **Runtime Web Port.** Inform NestJS to bind to port 3000 (Render automatically forwards HTTP traffic here). |

---

## 2. Frontend Environment Variables (Configured on Vercel)

When deploying your React app on Vercel, navigate to project **Settings > Environment Variables** and add the following:

| Environment Key | Value Example | Description |
| :--- | :--- | :--- |
| **`VITE_API_URL`** | `https://jaip-api.onrender.com` | **Backend API Base URL.** Paste the public URL of your deployed Render Web Service. (Omit the trailing slash). |

---

## 3. How to Obtain Postgres & Redis strings

### A. Neon PostgreSQL URL
1. Log in to [Neon.tech](https://neon.tech/) and navigate to the project dashboard.
2. Under **Connection String**, select **Prisma** or **PostgreSQL** protocol.
3. Check the **Pooled connection** checkbox (recommended).
4. Copy the URL string.

### B. Upstash Redis URL
1. Log in to [Upstash](https://upstash.com/) and click on your Redis database.
2. In the details panel, find the **Connection Details** section.
3. Select the **Node.js** tab or copy the **Redis Connect URL** (starting with `redis://` or `rediss://`).
