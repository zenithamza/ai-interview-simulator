# Mockroom — AI Interview Simulator

An AI-powered mock interview platform built on the MERN stack. Sign in, pick a role and
an interviewer style, answer questions out loud, and get honest, scored feedback —
question by question and as a full report — with your progress tracked over time.

**🔗 Live app:** [ai-interview-simulator-seven-blue.vercel.app](https://ai-interview-simulator-seven-blue.vercel.app/login)
Frontend on **Vercel** · Backend on **Render** (Docker) · DB on **MongoDB Atlas** · Email via **Brevo**

---

## Table of contents

- [What it does](#what-it-does)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Design decisions](#design-decisions--why-i-built-it-this-way)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running with Docker](#running-with-docker)
- [Testing](#testing)
- [API overview](#api-overview)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

---

## What it does

Most "interview prep" tools give you a static list of questions to read through.
Mockroom runs an actual simulated interview: it asks you a question, listens to (or
reads) your answer, scores it, and — based on how you just did — decides whether the
next question should be easier or harder, the way a real interviewer adjusts on the
fly. At the end, it synthesizes the whole session into a report with a topic-by-topic
breakdown of where you're genuinely strong versus where you're guessing, emails it to
you, and lets you generate a public link to share it.

## Features

**Core interview loop**
- Role selection (Frontend, Backend, Full-Stack, AI/ML, DevOps, Data Analyst)
- Voice-to-text answers via the browser's Web Speech API, with a live waveform and a
  soft interview-pacing timer — or just type your answer instead
- **Adaptive difficulty** — score well and the next question gets harder; struggle and
  it eases off, question by question, not decided upfront
- **Interviewer personas** — Friendly, Skeptical, or Rapid-fire, changing the AI's tone
  for both the questions it asks and the feedback it gives
- **Two formats** — Standard (5 mixed conceptual/practical/behavioral questions) or
  System Design (3 deep architecture questions)
- **Resume-aware questions** — optionally upload a PDF resume; the AI tailors 1–2
  questions to your actual listed experience instead of generic prompts
- **"Try a different question"** — regenerate any question on the spot, no penalty
- **Practice mode** — sessions that don't count toward your stats/streak and skip the
  report email, for low-stakes warmups

**Reporting & tracking**
- Per-answer scoring and feedback, generated immediately after each response
- Final report: overall score, strengths, weaknesses, a written summary, a study
  recommendation, and a **topic-level score breakdown** — not just one number
- **Shareable reports** — a public, read-only link to any completed report, viewable by
  anyone without an account and without exposing your other history
- **PDF export** of any report, generated client-side
- **Automatic email delivery** of your report the moment a session finishes (Brevo)
- **History dashboard** — total sessions, average score, strongest role, day streak,
  and a progress-over-time chart filterable by role

**Auth & account**
- Sign in with Google, or a passwordless email OTP (6-digit code, hashed, expires in
  10 minutes)
- JWT-based sessions; every interview is tied to a real account, not a browser token
- Route-level and ownership-level protection — you can't view someone else's interviews

**Polish**
- Dark / light theme toggle
- Distinctive, non-templated UI — a dark "interview room" aesthetic with a live audio
  waveform, mono/serif type pairing, and a call-sheet style role picker

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) + Tailwind v4 | Fast dev loop, utility-first styling without fighting a design system |
| Routing | React Router | Standard protected-route pattern for auth gating; `vercel.json` rewrite for SPA deep links |
| Charts | Recharts | Themed progress-over-time chart on the history dashboard |
| PDF export | jsPDF | Client-side report export, no server round-trip |
| Backend | Node.js (22-alpine) + Express | Simple, well-understood REST API |
| Database | MongoDB Atlas + Mongoose | Flexible schema for evolving interview/report shape; cloud-hosted, no server to manage |
| AI | Groq API (Llama 3.3) | Free tier, very fast inference, OpenAI-compatible chat API |
| Auth | Google OAuth (`google-auth-library`) + email OTP + JWT | No password storage; two low-friction sign-in paths |
| Email | Brevo transactional API | HTTP-based — avoids SMTP port restrictions on cloud hosts like Render |
| File upload | Multer + pdf-parse | Resume PDF → plain text for AI context |
| Rate limiting | express-rate-limit | Protects the AI quota and email quota from abuse |
| Testing | Node's built-in test runner (backend), Vitest + React Testing Library (frontend) | Zero extra config, fast, no framework lock-in |
| CI | GitHub Actions | Lint/test/build on every push |
| Containerization | Docker + Docker Compose | One-command local spin-up of the full stack |
| Hosting | Vercel (frontend) + Render (backend, Docker) | Free tiers, git-push deploys |

## Architecture

```
Browser (React SPA, Vercel)
   │  fetch + JWT bearer token
   ▼
Express API (Render, Docker)  ──────►  Groq API           (questions, feedback, reports)
   │                          ──────►  Google OAuth        (ID token verification)
   │                          ──────►  Brevo API           (OTP codes, report emails)
   ▼
MongoDB Atlas (Users, Interviews)
```

The interview flow is intentionally **one question at a time**, not batch-generated
upfront: `POST /interviews/start` creates the session with only the first question.
Each `POST /interviews/:id/answer` scores that answer *and* generates the next question
in the same request, at a difficulty computed from the score just given. This is what
makes the difficulty genuinely adaptive rather than just labeled "adaptive" — the next
question literally doesn't exist yet while you're answering the current one.

## Design decisions — why I built it this way

- **Groq over a paid LLM API.** Free tier, fast inference, and the AI layer is fully
  isolated in `backend/services/aiService.js` — swapping providers later touches one
  file, nothing else in the app cares which model is behind it.
- **JWT over server-side sessions.** No session store to manage, works cleanly across a
  separately-deployed frontend/backend, and scales horizontally without sticky sessions.
- **Two login paths instead of one.** Google Sign-In is the friction-free default; email
  OTP exists so the app doesn't hard-require a Google account, and because building a
  real OTP flow (hashing, expiry, attempt limits) is a better engineering demonstration
  than "just OAuth."
- **Brevo's HTTP API instead of SMTP — learned the hard way.** The original design used
  SMTP (Nodemailer + Gmail app password), which works fine locally. In production on
  Render, Gmail SMTP was unreliable — cloud hosts frequently throttle or block outbound
  SMTP ports. Switching to Brevo's transactional HTTP API sidesteps that entirely, since
  it's a normal HTTPS request rather than a raw SMTP connection.
- **Sparse unique index for `shareId`, and the bug it taught me.** Share links use a
  MongoDB sparse unique index so most interviews (which are never shared) don't need a
  `shareId` at all. Early on, the field had `default: null`, meaning every document
  explicitly stored `shareId: null` — and a sparse index only skips fields that are
  *absent*, not fields explicitly set to `null`. The second interview ever created
  collided on the unique index. Fix: remove the default so the field stays genuinely
  absent until a share link is actually requested.
- **Rate limiting on AI and OTP routes specifically**, not globally — those are the two
  endpoints that cost real quota or could be used to spam someone's inbox, so they get
  tighter limits than read-only endpoints like history.
- **Practice mode instead of a separate delete flow.** Rather than letting users
  create-then-delete throwaway sessions, practice mode marks intent upfront and simply
  excludes those sessions from stats and emails — simpler data model, same outcome.

## Project structure

```
ai-interview-simulator/
├── .github/workflows/ci.yml        # lint + test + build on every push
├── docker-compose.yml
├── backend/
│   ├── controllers/                # authController, interviewController, publicController
│   ├── middleware/auth.js          # JWT verification
│   ├── models/                     # User, Interview
│   ├── routes/                     # authRoutes, interviewRoutes, publicRoutes
│   ├── services/                   # aiService (Groq), emailService (Brevo), resumeService
│   ├── utils/                      # jwt.js, topicBreakdown.js
│   ├── tests/                      # node:test unit tests
│   └── Dockerfile                  # node:22-alpine
└── frontend/
    ├── src/
    │   ├── pages/                  # Login, Home, Interview, Report, SharedReport, History
    │   ├── components/             # Navbar, ProtectedRoute, Waveform, Timer, ProgressChart, StatsRow
    │   └── lib/                    # api.js, AuthContext, ThemeContext, useSpeechRecorder, roles, stats
    ├── vercel.json                 # SPA rewrite — serves index.html for all client-side routes
    └── Dockerfile
```

## Getting started

### Prerequisites
- Node.js 18+ locally (Docker image uses 22-alpine)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier is fine) or local MongoDB
- A free [Groq API key](https://console.groq.com/keys)
- A [Google OAuth client ID](https://console.cloud.google.com/apis/credentials) (Web application type)
- A free [Brevo](https://www.brevo.com) account for email (optional for local dev — see below)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-interview-simulator

cd backend && npm install
cd ../frontend && npm install
```

### 2. MongoDB
Free Atlas cluster, or run one locally. If using Atlas for a hosted deployment, add
`0.0.0.0/0` under **Network Access** — most free-tier hosts (Render included) don't have
a static outbound IP.

### 3. Google OAuth
[Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → Create
OAuth client ID → Web application → add `http://localhost:5173` **and** your deployed
frontend URL to Authorized JavaScript origins (leave redirect URIs blank). If your
consent screen is in "Testing" mode, add your Google account under Test users.

### 4. Email (Brevo)
OTP codes and finished reports send via Brevo's transactional email API
(`@getbrevo/brevo`), not SMTP — deliberately, to avoid outbound SMTP port restrictions
that many cloud hosts impose (see [Design decisions](#design-decisions--why-i-built-it-this-way)).

1. Create a free Brevo account (300 emails/day free).
2. Under **Senders, Domains & Dedicated IPs → Senders**, add and verify a sender email
   you own — no domain purchase required to send to arbitrary recipients.
3. Under **SMTP & API → API Keys**, generate an API key.
4. Set `BREVO_API_KEY`, `EMAIL_FROM_ADDRESS`, and `EMAIL_FROM_NAME` in `.env`.

If `BREVO_API_KEY` is unset, emails log to the backend console instead of sending — fine
for local dev.

### 5. Configure and run the backend

```bash
cd backend
cp .env.example .env
# fill in: MONGO_URI, GROQ_API_KEY, JWT_SECRET, GOOGLE_CLIENT_ID,
#          BREVO_API_KEY, EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME, CLIENT_ORIGIN
npm install
npm run dev        # http://localhost:5000
npm test
```

Generate `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`CLIENT_ORIGIN` controls CORS — comma-separate multiple origins if you need both local
and deployed frontend URLs allowed at once.

### 6. Configure and run the frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL → your backend URL, VITE_GOOGLE_CLIENT_ID → same as backend
npm install
npm run dev         # http://localhost:5173
npm test
```

Voice recording needs Chrome or Edge (Web Speech API support); typed answers work
anywhere.

## Environment variables

**`backend/.env`**

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `PORT` | No (default `5000`) | Backend port |
| `GROQ_API_KEY` | Yes | Free key from console.groq.com |
| `GROQ_MODEL` | No | Defaults to `llama-3.3-70b-versatile` |
| `JWT_SECRET` | Yes | Long random string signing session tokens |
| `GOOGLE_CLIENT_ID` | Yes | For Google Sign-In verification |
| `CLIENT_ORIGIN` | Yes | Allowed frontend origin(s) for CORS, comma-separated |
| `BREVO_API_KEY` | No | Enables real email delivery via Brevo |
| `EMAIL_FROM_ADDRESS` | No | Your Brevo-verified sender address |
| `EMAIL_FROM_NAME` | No | Sender display name |

**`frontend/.env`**

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Same client ID as the backend |

## Running with Docker

```bash
cd backend && cp .env.example .env   # fill in real values first
cd ..
export GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
docker compose up --build
```

Starts MongoDB, the backend, and the frontend (served via nginx) together.
Frontend → `http://localhost:5173`, backend → `http://localhost:5000`, Mongo →
`localhost:27017`.

## Testing

```bash
cd backend && npm test     # 17 tests — node's built-in runner, zero config
cd frontend && npm test    # 10 tests — Vitest + React Testing Library
```

Backend tests cover AI response JSON parsing, adaptive-difficulty logic, JWT
sign/verify, and topic-score aggregation. Frontend tests cover the history dashboard's
stats calculations and key components (Timer, Waveform). Both suites run at the
logic/component level — nothing depends on a live Groq key, database, or email provider
to pass, so CI stays fast and deterministic.

## API overview

All `/api/interviews/*` and `/api/auth/me` routes require `Authorization: Bearer <jwt>`.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/google` | Exchange a Google ID token for a session |
| POST | `/api/auth/otp/request` | Send a 6-digit login code by email |
| POST | `/api/auth/otp/verify` | Verify the code, get a session |
| GET | `/api/auth/me` | Current user |
| POST | `/api/interviews/start` | Start a session (multipart — role, difficulty, persona, mode, optional resume PDF) |
| POST | `/api/interviews/:id/answer` | Submit an answer; returns feedback + generates the next question |
| POST | `/api/interviews/:id/retry-question` | Regenerate the current question |
| POST | `/api/interviews/:id/finish` | Generate the final report, emails it |
| POST | `/api/interviews/:id/share` / `/unshare` | Toggle a public read-only link |
| GET | `/api/interviews` | List your sessions |
| GET | `/api/interviews/:id` | One session, full detail |
| GET | `/api/public/reports/:shareId` | Public, no auth — view a shared report |

## Deployment

Live stack: **frontend on Vercel**, **backend on Render** (Docker), **DB on MongoDB
Atlas**, **email via Brevo**.

Notes specific to this setup, in case you're replicating it:
- Backend Dockerfile uses `node:22-alpine` — some dependencies require Node ≥22.
- Frontend is a Vite SPA — `frontend/vercel.json` rewrites all routes to `index.html` so
  client-side routing (e.g. a direct link to `/login` or `/share/:id`) doesn't 404 on
  refresh.
- Backend CORS reads allowed origins from `CLIENT_ORIGIN` (comma-separated) — must
  include the deployed frontend's exact origin, protocol included.
- Google OAuth's Authorized JavaScript origins must include the deployed frontend's
  exact origin, or Sign-In fails with "origin not allowed."
- MongoDB Atlas Network Access must allow the backend host's outbound IP — `0.0.0.0/0`
  in practice, since Render's free tier has no static outbound IP.
- Email sends via Brevo's HTTP API rather than SMTP, since Gmail SMTP specifically was
  confirmed unreliable when called from Render — see
  [Design decisions](#design-decisions--why-i-built-it-this-way).

## Known limitations

- OTP/report emails currently send from a Brevo-verified personal address rather than a
  custom domain, since a domain hasn't been purchased for this portfolio project.
  Verifying a custom domain with Brevo (a one-time DNS setup) is the only remaining step
  to send from a branded address like `no-reply@yourdomain.com` — send-to-any-recipient
  already works as-is.
- Voice input relies on the Web Speech API, which isn't supported in Firefox or Safari;
  typed answers work everywhere as a fallback.
- Render's free tier spins the backend down after inactivity, so the first request after
  idling can take ~30–60 seconds to wake up.

## Roadmap

- [ ] Verify a custom domain with Brevo for branded sender addresses
- [ ] Refresh tokens for tighter session security
- [ ] API-level integration tests (Supertest against a mocked DB)
- [ ] Move resume text extraction to a background queue if PDF uploads scale up

## License

MIT — do whatever you'd like with this.
