# Mockroom — AI Interview Simulator

A MERN-stack mock interview app. Sign in, pick a role, answer questions out loud, and
get AI-generated feedback per answer plus a final improvement report — saved to your
account, emailed to you, and shareable.

## Stack

- **MongoDB** — users, interview sessions, answers, and reports
- **Express + Node** — REST API; Groq API (free) for questions/feedback; Google OAuth +
  email OTP for auth; Nodemailer for email; Multer + pdf-parse for resume uploads;
  express-rate-limit for abuse protection
- **React (Vite) + Tailwind v4** — UI; voice capture via the Web Speech API; Recharts for
  the progress chart; jsPDF for report export; dark/light theme toggle

## Features

- **Auth** — Google Sign-In or passwordless email OTP. Every interview is tied to your account.
- **Adaptive mock interview** — questions get harder or easier automatically based on how
  you're scoring, live per-question, not decided upfront.
- **Interviewer personas** — Friendly, Skeptical, or Rapid-fire — changes the AI's tone for
  both questions and feedback.
- **Two formats** — Standard (5 mixed questions) or System Design (3 deep architecture questions).
- **Resume-aware questions** — optionally upload a PDF resume; the AI tailors 1-2 questions
  to your actual experience.
- **"Try a different question"** — regenerate any question on the fly without restarting.
- **Practice mode** — sessions that don't count toward your stats/streak and skip the report email.
- **Topic-level weakness tracking** — each question is tagged with a topic; the final report
  and history dashboard show a score-by-topic breakdown, not just an overall number.
- **Shareable reports** — generate a public, read-only link to any completed report.
- **Email delivery + PDF export** — every finished report is emailed automatically, and can
  be downloaded as a PDF from the report page.
- **History dashboard** — total sessions, average score, strongest role, day streak, and a
  progress-over-time chart filterable by role.
- **Dark / light theme toggle**.

## Engineering

- **Tests** — 17 backend tests (`node --test`, built-in runner, no extra config) covering AI
  JSON parsing, adaptive difficulty, JWT, and topic-score math. 10 frontend tests (Vitest +
  React Testing Library) covering stats logic and key components.
- **CI** — `.github/workflows/ci.yml` runs lint/test/build for both apps on every push/PR.
- **Rate limiting** — OTP requests and all AI-calling endpoints are rate-limited per IP.
- **Docker** — `docker-compose.yml` + Dockerfiles for backend, frontend (nginx), and MongoDB.

## Project structure

```
ai-interview-simulator/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── backend/
│   ├── controllers/  (authController, interviewController, publicController)
│   ├── middleware/auth.js
│   ├── models/ (User, Interview)
│   ├── routes/ (authRoutes, interviewRoutes, publicRoutes)
│   ├── services/ (aiService, emailService, resumeService)
│   ├── utils/ (jwt, topicBreakdown)
│   ├── tests/
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── pages/ (Login, Home, Interview, Report, SharedReport, History)
    │   ├── components/ (Navbar, ProtectedRoute, Waveform, Timer, ProgressChart, StatsRow)
    │   ├── lib/ (api.js, AuthContext, ThemeContext, useSpeechRecorder, roles, stats)
    └── Dockerfile
```

## Setup (local, without Docker)

### 1. MongoDB
Free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or run one locally.

### 2. Groq API key (free)
[console.groq.com/keys](https://console.groq.com/keys) — no credit card required.

### 3. Google OAuth
[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) →
Create OAuth client ID → Web application → add `http://localhost:5173` to Authorized
JavaScript origins (leave redirect URIs blank). If your consent screen is in "Testing"
mode, add your Google account under Test users.

### 4. Email (SMTP)
Any provider works — Gmail app password, Mailtrap, SendGrid, etc. If skipped, emails are
logged to the backend console instead of sent (fine for local dev).

### 5. Backend

```bash
cd backend
cp .env.example .env
# fill in: MONGO_URI, GROQ_API_KEY, JWT_SECRET, GOOGLE_CLIENT_ID, SMTP_*
npm install
npm run dev        # http://localhost:5000
npm test           # run the backend test suite
```

Generate `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### 6. Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_GOOGLE_CLIENT_ID to match the backend
npm install
npm run dev         # http://localhost:5173
npm test            # run the frontend test suite
```

Voice recording requires Chrome or Edge — other browsers can still type answers.

## Setup with Docker

```bash
cd backend && cp .env.example .env   # fill in real values
cd ..
export GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
docker compose up --build
```
Frontend → `http://localhost:5173`, backend → `http://localhost:5000`, Mongo → `localhost:27017`.

## How it works

1. **Login** — Google ID token verified server-side, or a hashed/expiring email OTP. Either
   issues a JWT stored client-side and sent as `Authorization: Bearer <token>`.
2. **Home** — pick role, starting difficulty, persona, format, optionally attach a resume PDF.
   `POST /api/interviews/start` (multipart) generates the first question only.
3. **Interview** — each answer is scored by Groq; the *next* question is generated afterward,
   at a difficulty nudged up or down based on that score (`nextDifficulty` in `aiService.js`).
   "Try a different question" calls `/retry-question` to swap the current one without penalty.
4. **Report** — `/finish` synthesizes the full transcript into a score, strengths, weaknesses,
   a topic-by-topic breakdown, and a recommendation — then emails it (unless practice mode)
   and exposes `/share` for a public read-only link.
5. **History** — stats and the progress chart are computed client-side from
   `GET /api/interviews`, excluding practice-mode sessions.

## Next steps if you want to extend it further

- Deploy: frontend to Vercel/Netlify, backend to Render/Railway, DB on Atlas — add your
  production URL to Google's Authorized JavaScript origins and to `CLIENT_ORIGIN`/`VITE_API_URL`.
- Add refresh tokens for tighter session security.
- Move resume text extraction to a background queue if PDF uploads become large-scale.
