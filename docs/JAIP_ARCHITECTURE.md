# JAIP — Job Application Intelligence Platform
## Complete Architecture & Developer Reference
**Version:** 1.0  
**Author:** Atul Raina  
**Stack:** React + NestJS + PostgreSQL + Redis + BullMQ + LangGraph

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Technology Stack](#3-technology-stack)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Backend — NestJS Modules](#6-backend--nestjs-modules)
7. [API Endpoints](#7-api-endpoints)
8. [Queue Architecture](#8-queue-architecture)
9. [AI Agent Architecture](#9-ai-agent-architecture)
10. [Gmail Integration](#10-gmail-integration)
11. [Frontend — React Pages & Components](#11-frontend--react-pages--components)
12. [Docker Setup](#12-docker-setup)
13. [Data Flow — End to End](#13-data-flow--end-to-end)
14. [Edge Cases & How to Handle Them](#14-edge-cases--how-to-handle-them)
15. [MVP Build Order](#15-mvp-build-order)

---

## 1. Project Overview

JAIP automatically tracks job applications by scanning a user's Gmail.  
It classifies emails (application confirmed, interview, rejection, offer) and maintains a live dashboard.

**What the system does:**
- User logs in with Google (OAuth)
- User connects their Gmail
- System scans Gmail for job-related emails
- AI classifies each email and extracts company name, role, status
- Dashboard shows all applications with status, timeline, and analytics
- AI generates insights like response rates, follow-up reminders

---

## 2. Folder Structure

```
jaip/
├── docker-compose.yml
├── .env                          ← single env file for local dev
│
├── backend/                      ← NestJS app
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/                 ← Google OAuth, JWT
│   │   ├── gmail/                ← Gmail connect, sync, fetch
│   │   ├── applications/         ← CRUD for applications
│   │   ├── emails/               ← Email storage and retrieval
│   │   ├── analytics/            ← Stats and metrics
│   │   ├── insights/             ← AI-generated insights
│   │   ├── queues/               ← BullMQ queue definitions
│   │   ├── workers/              ← BullMQ worker processors
│   │   ├── agents/               ← LangGraph AI agents
│   │   ├── database/             ← TypeORM entities and migrations
│   │   └── common/               ← Guards, interceptors, DTOs
│   ├── package.json
│   └── Dockerfile
│
└── frontend/                     ← React + Vite app
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Applications.tsx
    │   │   ├── ApplicationDetail.tsx
    │   │   ├── Analytics.tsx
    │   │   ├── Insights.tsx
    │   │   └── Settings.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   ├── applications/
    │   │   ├── analytics/
    │   │   └── common/
    │   ├── hooks/
    │   ├── api/                  ← axios API calls
    │   └── store/                ← Zustand state
    ├── package.json
    └── Dockerfile
```

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | React | 18 | UI |
| Frontend build | Vite | 5 | Dev server and bundler |
| UI components | ShadCN/UI | latest | Prebuilt components |
| Styling | Tailwind CSS | 3 | Utility CSS |
| Icons | Lucide React | latest | Icons |
| Animations | Framer Motion | 11 | Page transitions |
| State management | Zustand | 4 | Global client state |
| HTTP client | Axios | 1.6 | API calls |
| Backend | NestJS | 10 | API framework |
| Language | TypeScript | 5 | Both frontend and backend |
| ORM | TypeORM | 0.3 | Database queries |
| Database | PostgreSQL | 16 | Primary data store |
| Cache / Queue | Redis | 7 | BullMQ dependency + caching |
| Job queues | BullMQ | 5 | Background processing |
| AI orchestration | LangGraph | latest | AI agent workflows |
| AI model | OpenAI GPT-4o-mini | latest | Classification and extraction |
| Auth | Google OAuth 2.0 | — | Login |
| JWT | @nestjs/jwt | latest | Session tokens |
| Gmail | Google APIs Node.js | latest | Email fetching |
| Containerization | Docker + Compose | latest | Local development |

---

## 4. Environment Variables

Create a single `.env` file in the project root. Both backend and frontend read from it via Docker Compose.

```env
# ─── PostgreSQL ───────────────────────────────────────────
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=jaip
POSTGRES_PASSWORD=jaip_secret
POSTGRES_DB=jaip_db

# ─── Redis ────────────────────────────────────────────────
REDIS_HOST=redis
REDIS_PORT=6379

# ─── JWT ──────────────────────────────────────────────────
JWT_SECRET=replace_with_random_256bit_string
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=replace_with_another_random_256bit_string
JWT_REFRESH_EXPIRES_IN=30d

# ─── Google OAuth ─────────────────────────────────────────
# Get these from console.cloud.google.com
# Enable: Gmail API, Google OAuth2 API
# Authorized redirect URI: http://localhost:3000/auth/google/callback
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# ─── OpenAI ───────────────────────────────────────────────
OPENAI_API_KEY=your_openai_api_key

# ─── App ──────────────────────────────────────────────────
BACKEND_PORT=3000
FRONTEND_PORT=5173
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## 5. Database Schema

### Users table
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255),
  avatar      VARCHAR(500),
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### connected_accounts table
Stores the Gmail OAuth tokens for each user.
```sql
CREATE TABLE connected_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider       VARCHAR(50) NOT NULL DEFAULT 'gmail',
  access_token   TEXT,                   -- encrypted at rest
  refresh_token  TEXT NOT NULL,          -- encrypted at rest
  token_expiry   TIMESTAMP,
  history_id     VARCHAR(100),           -- Gmail history ID for incremental sync
  connected_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

### applications table
```sql
CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name  VARCHAR(255) NOT NULL,
  role          VARCHAR(255),
  source        VARCHAR(100),            -- linkedin, naukri, wellfound, referral, direct
  status        VARCHAR(50) NOT NULL DEFAULT 'applied',
                                         -- applied | interviewing | assessment | offer | rejected | withdrawn
  applied_date  DATE,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status  ON applications(user_id, status);
```

### emails table
```sql
CREATE TABLE emails (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id     UUID REFERENCES applications(id) ON DELETE SET NULL,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gmail_message_id   VARCHAR(255) UNIQUE NOT NULL,
  gmail_thread_id    VARCHAR(255),
  sender             VARCHAR(255),
  subject            TEXT,
  body_snippet       TEXT,               -- first 500 chars only, full body in S3
  classification     VARCHAR(50),        -- application_confirm | interview | assessment | rejection | offer | recruiter_general
  confidence         DECIMAL(4,3),       -- 0.000 to 1.000
  received_at        TIMESTAMP,
  processed_at       TIMESTAMP
);

CREATE INDEX idx_emails_user_id      ON emails(user_id);
CREATE INDEX idx_emails_thread_id    ON emails(gmail_thread_id);
CREATE INDEX idx_emails_application  ON emails(application_id);
```

### status_history table
Every time an application status changes, record it here.
```sql
CREATE TABLE status_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  previous_status   VARCHAR(50),
  new_status        VARCHAR(50) NOT NULL,
  changed_by        VARCHAR(50) DEFAULT 'system',   -- system | user
  created_at        TIMESTAMP DEFAULT NOW()
);
```

### interviews table
```sql
CREATE TABLE interviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  interview_date   TIMESTAMP,
  round            VARCHAR(100),          -- phone_screen | technical | hr | final
  meeting_link     VARCHAR(500),
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);
```

### offers table
```sql
CREATE TABLE offers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  ctc              VARCHAR(100),
  location         VARCHAR(255),
  offer_date       DATE,
  deadline         DATE,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);
```

### insights table
```sql
CREATE TABLE insights (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  type           VARCHAR(50),             -- tip | warning | achievement | reminder
  is_read        BOOLEAN DEFAULT FALSE,
  generated_at   TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Backend — NestJS Modules

### Module list

```
AppModule
├── AuthModule          ← Google OAuth + JWT
├── GmailModule         ← Connect, sync, fetch emails
├── ApplicationsModule  ← CRUD operations
├── EmailsModule        ← Email storage + retrieval
├── AnalyticsModule     ← Stats queries
├── InsightsModule      ← AI insights
├── QueuesModule        ← BullMQ queue setup
├── WorkersModule       ← BullMQ processors
└── AgentsModule        ← LangGraph agents
```

---

### AuthModule

**File:** `src/auth/auth.module.ts`

What it does:
- Google OAuth login via Passport.js
- Issues JWT access token (15 min) and refresh token (30 days)
- Stores refresh token in DB (encrypted)
- `JwtAuthGuard` — applied to all protected routes

**Files to create:**
```
src/auth/
├── auth.module.ts
├── auth.controller.ts    ← GET /auth/google, GET /auth/google/callback, POST /auth/refresh, POST /auth/logout
├── auth.service.ts
├── strategies/
│   ├── google.strategy.ts      ← Passport Google OAuth strategy
│   └── jwt.strategy.ts         ← Passport JWT strategy
└── guards/
    └── jwt-auth.guard.ts
```

**auth.service.ts responsibilities:**
- `googleLogin(googleUser)` — find or create user, issue tokens
- `refreshTokens(userId, refreshToken)` — validate refresh token, issue new pair
- `logout(userId)` — invalidate refresh token in DB

---

### GmailModule

**File:** `src/gmail/gmail.module.ts`

What it does:
- Stores OAuth credentials in `connected_accounts`
- Fetches emails using Gmail API
- Tracks `history_id` for incremental sync (only fetch new emails each run)
- Enqueues emails for classification after fetch

**Files to create:**
```
src/gmail/
├── gmail.module.ts
├── gmail.controller.ts    ← POST /gmail/connect, DELETE /gmail/disconnect, GET /gmail/status
├── gmail.service.ts
└── gmail-api.service.ts   ← wrapper around googleapis Node.js client
```

**gmail.service.ts responsibilities:**
- `connectGmail(userId, authCode)` — exchange code for tokens, save to DB
- `disconnectGmail(userId)` — delete connected_account record
- `syncEmails(userId)` — fetch new emails since last `history_id`, save raw to DB, enqueue classification jobs

**gmail-api.service.ts responsibilities:**
- `getNewMessages(refreshToken, historyId)` — returns array of raw Gmail message objects
- `getMessageDetail(messageId)` — returns full email with sender, subject, snippet
- Handles token refresh automatically (call Google token endpoint if access token expired)

---

### ApplicationsModule

**Files to create:**
```
src/applications/
├── applications.module.ts
├── applications.controller.ts
├── applications.service.ts
├── dto/
│   ├── create-application.dto.ts
│   └── update-application.dto.ts
└── entities/
    └── application.entity.ts
```

**API operations:**
- `GET /applications` — list all, support filters: status, source, company search
- `POST /applications` — manual create
- `GET /applications/:id` — single application with email timeline
- `PATCH /applications/:id` — update status, notes, etc.
- `DELETE /applications/:id` — soft delete (set status = withdrawn)

---

### AnalyticsModule

**Files to create:**
```
src/analytics/
├── analytics.module.ts
├── analytics.controller.ts    ← GET /analytics/summary, GET /analytics/charts
└── analytics.service.ts
```

**analytics.service.ts queries:**
- Total applications count
- Count by status (applied, interviewing, offer, rejected)
- Applications per month (last 6 months)
- Applications per source (LinkedIn, Naukri, etc.)
- Response rate = (total with any recruiter reply / total applied) × 100
- Average days from applied to first response

All these are simple `GROUP BY` SQL queries on the `applications` table.

---

### QueuesModule

**Files to create:**
```
src/queues/
├── queues.module.ts
└── queue.constants.ts     ← export queue name strings
```

**Queue names:**
```typescript
export const QUEUES = {
  GMAIL_SYNC:           'gmail-sync',
  CLASSIFICATION:       'classification',
  APPLICATION_MATCHING: 'application-matching',
  ANALYTICS:            'analytics',
  FOLLOW_UP:            'follow-up',
};
```

**BullMQ setup in queues.module.ts:**
```typescript
BullModule.forRoot({
  connection: { host: process.env.REDIS_HOST, port: +process.env.REDIS_PORT }
})
BullModule.registerQueue(
  { name: QUEUES.GMAIL_SYNC },
  { name: QUEUES.CLASSIFICATION },
  { name: QUEUES.APPLICATION_MATCHING },
  { name: QUEUES.ANALYTICS },
  { name: QUEUES.FOLLOW_UP },
)
```

---

### WorkersModule

Each worker listens to one queue and processes jobs.

**Files to create:**
```
src/workers/
├── workers.module.ts
├── gmail-sync.worker.ts          ← processes gmail-sync jobs
├── classification.worker.ts      ← processes classification jobs
├── application-matching.worker.ts
├── analytics.worker.ts
└── follow-up.worker.ts
```

**Job payloads:**

`gmail-sync` job:
```typescript
{ userId: string }
```

`classification` job:
```typescript
{ emailId: string, subject: string, bodySnippet: string, sender: string }
```

`application-matching` job:
```typescript
{ emailId: string, userId: string, classification: string, company: string, role: string, confidence: number }
```

**Retry config (apply to all workers):**
```typescript
@Processor(QUEUES.CLASSIFICATION, {
  concurrency: 3,
  limiter: { max: 10, duration: 1000 },
})
// In job options when adding:
{ attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
```

---

### AgentsModule

**Files to create:**
```
src/agents/
├── agents.module.ts
├── classification.agent.ts      ← classifies a single email
├── extraction.agent.ts          ← extracts company, role, location
└── insight.agent.ts             ← generates insights for a user
```

See Section 9 for full agent details.

---

## 7. API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /auth/google | No | Redirect to Google OAuth |
| GET | /auth/google/callback | No | Google redirects here after login |
| POST | /auth/refresh | No | Get new access token using refresh token |
| POST | /auth/logout | Yes | Invalidate refresh token |
| GET | /auth/me | Yes | Get current user profile |

### Gmail
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /gmail/connect | Yes | Connect Gmail (exchange OAuth code) |
| DELETE | /gmail/disconnect | Yes | Disconnect Gmail |
| GET | /gmail/status | Yes | Check if Gmail is connected |
| POST | /gmail/sync | Yes | Trigger manual sync |

### Applications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /applications | Yes | List applications (query: status, source, search, page, limit) |
| POST | /applications | Yes | Create manually |
| GET | /applications/:id | Yes | Get single with emails and timeline |
| PATCH | /applications/:id | Yes | Update fields |
| DELETE | /applications/:id | Yes | Delete |
| GET | /applications/:id/timeline | Yes | Status history |

### Analytics
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /analytics/summary | Yes | KPI card data (totals, rates) |
| GET | /analytics/by-month | Yes | Applications per month |
| GET | /analytics/by-source | Yes | Applications per platform |
| GET | /analytics/funnel | Yes | applied → interviewing → offer conversion |

### Insights
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /insights | Yes | List insights for current user |
| PATCH | /insights/:id/read | Yes | Mark as read |

---

## 8. Queue Architecture

### Queue flow

```
Gmail API
    ↓
[gmail-sync queue]
    ↓  (after emails saved to DB)
[classification queue]  ← one job per email
    ↓  (after classification)
[application-matching queue]
    ↓  (after matching)
Dashboard updated via API polling
```

### Scheduled queues

| Queue | Schedule | What it does |
|---|---|---|
| gmail-sync | Every 5 minutes (cron) | Sync all connected Gmail accounts |
| analytics | Every 1 hour | Refresh analytics cache in Redis |
| follow-up | Daily at 9 AM | Find applications with no activity in 14 days, create insights |

**Adding a scheduled job (gmail-sync example):**
```typescript
// In gmail-sync.worker.ts or a dedicated scheduler service
@Cron('*/5 * * * *')
async scheduleGmailSync() {
  const users = await this.usersService.getAllWithConnectedGmail();
  for (const user of users) {
    await this.gmailSyncQueue.add('sync', { userId: user.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}
```

### Dead letter handling

If a job fails all 3 retries, BullMQ marks it as `failed`. Add a listener:
```typescript
this.classificationQueue.on('failed', (job, error) => {
  this.logger.error(`Job ${job.id} failed: ${error.message}`, { jobData: job.data });
  // Optionally: save failure to audit_log table
});
```

---

## 9. AI Agent Architecture

All agents use OpenAI GPT-4o-mini (cheap, fast, accurate for this task).

### Classification Agent

**Input:** `{ subject: string, sender: string, bodySnippet: string }`  
**Output:** `{ classification: string, confidence: number, reasoning: string }`

**Classification types:**
- `application_confirm` — "We received your application"
- `interview` — "We'd like to schedule an interview"
- `assessment` — "Please complete this coding test"
- `rejection` — "We have decided to move forward with other candidates"
- `offer` — "We are pleased to offer you"
- `recruiter_general` — any other recruiter message

**Confidence threshold rule:**
- If `confidence >= 0.70` → proceed to extraction and matching
- If `confidence < 0.70` → set application status to `needs_review`, do not auto-update

**Prompt template:**
```
You are classifying a job-related email.

Email:
Subject: {subject}
From: {sender}
Body: {bodySnippet}

Classify this email into exactly one of these types:
- application_confirm
- interview
- assessment
- rejection
- offer
- recruiter_general

Respond with JSON only:
{
  "classification": "<type>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<one sentence>"
}
```

---

### Extraction Agent

**Input:** `{ subject: string, sender: string, bodySnippet: string }`  
**Output:** `{ company: string | null, role: string | null, location: string | null, recruiterName: string | null, interviewDate: string | null }`

**Prompt template:**
```
Extract structured data from this job email.

Email:
Subject: {subject}
From: {sender}
Body: {bodySnippet}

Respond with JSON only. Use null for any field not found:
{
  "company": "<company name or null>",
  "role": "<job title or null>",
  "location": "<city/remote or null>",
  "recruiterName": "<recruiter name or null>",
  "interviewDate": "<ISO date string or null>"
}
```

---

### Insight Agent

Runs once per day per user. Uses the user's analytics data as input.

**Input:** user's analytics summary from DB  
**Output:** array of 3–5 insight objects

**Prompt template:**
```
You are a career coach analyzing job application data.

User's application data:
- Total applications: {total}
- By source: {sourceBreakdown}
- By status: {statusBreakdown}
- Applications this month: {thisMonth}
- Applications last month: {lastMonth}
- Average response time: {avgResponseDays} days
- Applications with no activity in 14+ days: {staleCount}

Generate 3 to 5 actionable insights. Each insight must be specific, not generic.

Respond with JSON only:
[
  {
    "title": "<short title>",
    "description": "<one or two specific sentences>",
    "type": "tip | warning | achievement | reminder"
  }
]
```

---

### Agent error handling

Wrap every OpenAI call in try/catch. If the API fails:
```typescript
try {
  const result = await openai.chat.completions.create({ ... });
  return JSON.parse(result.choices[0].message.content);
} catch (error) {
  this.logger.error('Classification agent failed', { emailId, error: error.message });
  // Return safe default so the pipeline does not break
  return { classification: 'recruiter_general', confidence: 0, reasoning: 'agent_error' };
}
```

---

## 10. Gmail Integration

### Setup (do this once in Google Cloud Console)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project called `jaip`
3. Enable these APIs: **Gmail API**, **Google OAuth2 API**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy Client ID and Client Secret to your `.env` file

### Gmail OAuth scopes to request

```typescript
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',  // read emails
  'profile',                                          // user name and avatar
  'email',                                            // user email address
];
```

### Incremental sync logic

Gmail API provides a `historyId` — a cursor that marks where you last synced. On each sync:

```typescript
async syncEmails(userId: string) {
  const account = await this.getConnectedAccount(userId);
  const gmail = this.getGmailClient(account.refreshToken);

  if (!account.historyId) {
    // First sync: fetch last 3 months of messages
    const messages = await gmail.users.messages.list({
      userId: 'me',
      q: 'category:primary newer_than:90d',
      maxResults: 500,
    });
    // Fetch detail for each message, save to emails table
    // Save the historyId from the last message
  } else {
    // Subsequent syncs: only fetch changes since last historyId
    const history = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: account.historyId,
    });
    // Process only new messages from history
    // Update historyId in connected_accounts
  }
}
```

### Email relevance filter

Not all emails are job-related. Filter using this Gmail search query on first sync:
```
(subject:application OR subject:interview OR subject:offer OR subject:assessment OR subject:position OR subject:opportunity OR subject:recruiter) category:primary
```

After first sync, use incremental history — let the AI classification decide what is relevant.

---

## 11. Frontend — React Pages & Components

### Routing setup

```tsx
// App.tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route element={<ProtectedLayout />}>
    <Route path="/"              element={<Dashboard />} />
    <Route path="/applications"  element={<Applications />} />
    <Route path="/applications/:id" element={<ApplicationDetail />} />
    <Route path="/analytics"     element={<Analytics />} />
    <Route path="/insights"      element={<Insights />} />
    <Route path="/settings"      element={<Settings />} />
  </Route>
</Routes>
```

`ProtectedLayout` checks for a valid JWT token. If missing, redirect to `/login`.

---

### Pages

**Login page (`/login`)**
- Shows "Sign in with Google" button
- Clicking it calls `GET /auth/google` which redirects to Google
- After OAuth, Google redirects to `/auth/google/callback` on the backend
- Backend sets JWT in an HttpOnly cookie or returns it in the response
- Frontend redirects to `/`

**Dashboard page (`/`)**
- KPI cards: Total, Responses, Interviews, Offers, Pending, Rejections
- Line chart: Applications over last 6 months
- Funnel chart: applied → interview → offer
- Recent applications table (last 10)
- Unread insights strip at top

**Applications page (`/applications`)**
- Searchable, filterable table
- Filters: Status dropdown, Source dropdown, Date range
- Each row: company, role, source, status badge, applied date, last activity
- "Add application" button opens a modal

**Application detail page (`/applications/:id`)**
- Company name, role, source, current status
- Status update dropdown
- Email timeline (list of emails linked to this application, chronological)
- Notes textarea (auto-save)
- Status history (when did status change and to what)

**Analytics page (`/analytics`)**
- Bar chart: applications per month
- Pie chart: applications by source
- Stats: response rate %, interview rate %, offer rate %
- Table: top companies applied to

**Insights page (`/insights`)**
- Cards for each AI-generated insight
- Type badge: tip / warning / achievement / reminder
- Mark as read button

**Settings page (`/settings`)**
- Gmail connection status (connected / not connected)
- Connect / Disconnect Gmail button
- Profile info (name, email, avatar from Google)
- Manual sync button (triggers POST /gmail/sync)

---

### API client setup

```typescript
// src/api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,  // send cookies
});

// Interceptor: attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: on 401, try to refresh token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('access_token', data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(error.config);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### Zustand store

```typescript
// src/store/useAppStore.ts
import { create } from 'zustand';

interface AppStore {
  user: User | null;
  setUser: (user: User | null) => void;
  gmailConnected: boolean;
  setGmailConnected: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  gmailConnected: false,
  setGmailConnected: (v) => set({ gmailConnected: v }),
}));
```

---

## 12. Docker Setup

### docker-compose.yml

```yaml
version: '3.9'

services:

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run start:dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    env_file: .env
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host

volumes:
  postgres_data:
  redis_data:
```

### backend/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
```

### frontend/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

### Start the entire project

```bash
docker compose up
```

That's it. No cloud, no Kubernetes, no AWS required.

---

## 13. Data Flow — End to End

This is the complete journey of one email from Gmail to the dashboard.

```
1. USER LOGS IN
   Frontend → GET /auth/google
   → Google OAuth consent screen
   → Google redirects to GET /auth/google/callback
   → Backend creates user in DB (or finds existing)
   → Backend issues JWT access token + refresh token
   → Frontend stores access token, redirects to dashboard

2. USER CONNECTS GMAIL
   Frontend → POST /gmail/connect  (with OAuth authorization code)
   → Backend exchanges code for Gmail access + refresh token
   → Saves tokens encrypted in connected_accounts table
   → Returns { connected: true }

3. FIRST SYNC
   BullMQ cron (every 5 min) adds gmail-sync job for each user
   → gmail-sync worker calls gmail.service.syncEmails(userId)
   → Fetches last 90 days of emails from Gmail API
   → Saves each email to emails table (gmail_message_id, subject, sender, snippet)
   → Saves the historyId from the last message to connected_accounts
   → For each email: adds classification job to classification queue

4. EMAIL CLASSIFICATION
   classification worker picks up job { emailId, subject, sender, bodySnippet }
   → Calls ClassificationAgent.classify(...)
   → Agent sends prompt to OpenAI GPT-4o-mini
   → OpenAI returns { classification, confidence, reasoning }
   → If confidence >= 0.70:
       - Calls ExtractionAgent.extract(...) to get company, role
       - Updates emails table: classification, confidence
       - Adds application-matching job to queue
   → If confidence < 0.70:
       - Updates email classification = 'needs_review'
       - No further processing

5. APPLICATION MATCHING
   application-matching worker picks up job
   → Looks for existing application: WHERE user_id = X AND company_name ILIKE Y AND role ILIKE Z
   → If found: links email to existing application, may update status
   → If not found: creates new application record
   → Updates application status based on classification:
       - interview → status = 'interviewing'
       - rejection → status = 'rejected'
       - offer → status = 'offer'
   → Inserts row into status_history table

6. DASHBOARD SHOWS DATA
   Frontend polls GET /applications every 30 seconds (or on page focus)
   GET /analytics/summary for KPI cards
   → Backend queries PostgreSQL
   → Returns current data
   → Frontend renders updated dashboard

7. INSIGHT GENERATION (daily)
   BullMQ daily cron at 9 AM triggers follow-up + analytics queues
   → analytics worker: refreshes Redis cache for analytics data
   → follow-up worker: calls InsightAgent with user's stats
   → Agent returns 3–5 insights
   → Saved to insights table
   → User sees them on Insights page
```

---

## 14. Edge Cases & How to Handle Them

| Edge case | How to handle |
|---|---|
| **Duplicate email** | `gmail_message_id` has a UNIQUE constraint. `INSERT ... ON CONFLICT DO NOTHING` |
| **Duplicate application** | Before creating, query `WHERE company_name ILIKE $1 AND role ILIKE $2 AND user_id = $3`. If found, link email to existing application instead of creating new |
| **Multiple roles at same company** | Match on (company + role), not just company. Different role = different application row |
| **AI misclassification** | Confidence < 0.70 sets status to `needs_review`. User can manually correct on dashboard |
| **Gmail token expired** | Before every Gmail API call, check `token_expiry`. If expired, use `refresh_token` to get a new `access_token`. Update DB |
| **OAuth revocation** | Gmail API returns 401 or 403. Catch this error, set `connected_accounts.connected = false`, show "Reconnect Gmail" banner to user |
| **Gmail rate limits** | Gmail API: 250 quota units/second. Add `limiter: { max: 5, duration: 1000 }` to the gmail-sync BullMQ queue |
| **Worker crash** | BullMQ automatically keeps jobs in `active` state. On restart, jobs are retried. This is built into BullMQ — nothing extra needed |
| **Redis down** | BullMQ will throw on queue operations. Wrap queue `add()` calls in try/catch. Jobs will be missed during downtime — acceptable for MVP |
| **PostgreSQL down** | NestJS will throw 500. API returns 503. Add global exception filter to return `{ error: 'Service temporarily unavailable' }` |
| **OpenAI API down** | Catch error in agent, return safe default (see Section 9). Job completes without classification. Sync will not break |
| **Empty Gmail** | No messages returned = no jobs enqueued = no errors. Dashboard shows "No applications found" empty state |
| **Thread matching** | Multiple emails in one thread belong to one application. Group by `gmail_thread_id` when linking emails to applications |

---

## 15. MVP Build Order

Build in this exact order. Each phase is independently testable.

### Phase 1 — Foundation (Week 1)
- [ ] Set up folder structure
- [ ] Create `docker-compose.yml` with postgres and redis
- [ ] Create NestJS project, connect to PostgreSQL with TypeORM
- [ ] Run migrations — create all tables from Section 5
- [ ] Verify: `docker compose up` starts with no errors, DB tables exist

### Phase 2 — Auth (Week 1)
- [ ] Implement Google OAuth login (Passport.js google strategy)
- [ ] Issue JWT access token + refresh token on login
- [ ] `JwtAuthGuard` protecting routes
- [ ] `GET /auth/me` returns current user
- [ ] `POST /auth/refresh` works
- [ ] Verify: can log in with Google, get a JWT, call protected endpoint

### Phase 3 — Gmail Integration (Week 2)
- [ ] `POST /gmail/connect` — save tokens to DB
- [ ] `gmail-api.service.ts` — wrapper for Gmail API calls
- [ ] `gmail.service.ts` — first sync (fetch last 90 days) and incremental sync
- [ ] Save emails to `emails` table
- [ ] Verify: after connecting Gmail, emails appear in DB

### Phase 4 — Queue + Classification (Week 2)
- [ ] Set up BullMQ queues (Section 8)
- [ ] `gmail-sync` worker calls `gmailService.syncEmails`
- [ ] `classification` worker calls `ClassificationAgent`
- [ ] `application-matching` worker creates / updates applications
- [ ] Cron: gmail-sync every 5 minutes
- [ ] Verify: after sync, emails are classified and applications are created in DB

### Phase 5 — REST API (Week 3)
- [ ] Applications CRUD endpoints (Section 7)
- [ ] Analytics endpoints
- [ ] Insights endpoints
- [ ] Verify: Postman can call all endpoints and get correct data

### Phase 6 — Frontend (Week 3–4)
- [ ] React project with Vite, Tailwind, ShadCN
- [ ] Login page with Google button
- [ ] Protected routes with JWT check
- [ ] Dashboard page with KPI cards (hardcoded first, then real API)
- [ ] Applications list page
- [ ] Application detail page
- [ ] Analytics page with charts
- [ ] Settings page with Gmail connect/disconnect
- [ ] Verify: full user journey works end to end

### Phase 7 — Polish (Week 4)
- [ ] Dark mode
- [ ] Mobile responsive layout
- [ ] Loading states and error states on all pages
- [ ] Empty states ("No applications yet — connect your Gmail to get started")
- [ ] Insight generation agent
- [ ] Follow-up reminders

---

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd jaip

# 2. Copy env file and fill in your credentials
cp .env.example .env
# Edit .env — add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENAI_API_KEY

# 3. Start everything
docker compose up

# Backend runs at: http://localhost:3000
# Frontend runs at: http://localhost:5173
# PostgreSQL at:    localhost:5432
# Redis at:         localhost:6379
```

---

*This document is the single source of truth for JAIP architecture. All implementation decisions should reference this document first.*
