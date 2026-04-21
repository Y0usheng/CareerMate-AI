# CareerMate AI

An AI-powered career coach built around your resume. Upload a PDF / DOCX, ask questions, and get tailored suggestions for bullet-point rewrites, role targeting, and interview prep — all grounded in the actual document you uploaded.

![Status](https://img.shields.io/badge/status-in%20development-blue)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-green)
![Frontend](https://img.shields.io/badge/frontend-Next.js%2015-black)
![AI](https://img.shields.io/badge/AI-Gemini%202.5-4285F4)

## Features

- **Chat with your resume.** Resumes are sent inline to Gemini so the model reads the real PDF (layout, headings, dates) instead of a lossy text extract.
- **Conversation history.** Sidebar keeps your past chats, grouped by topic, persisted locally.
- **Auth + onboarding.** Email/password accounts, JWT sessions, first-run onboarding that feeds context into every prompt.
- **Password reset.** 4-digit code flow with 15-minute expiry, single-use codes, dev-mode console output (swap in SMTP/Resend for production).
- **Resume management.** Upload / replace / delete, with only the latest marked active.
- **Consistent UI shell.** Dashboard, Resume and Settings all share the same sidebar, account card and icon-only log-out to prevent misclicks.

## Tech stack

| Layer      | Stack                                                                 |
|------------|-----------------------------------------------------------------------|
| Frontend   | Next.js 15 (App Router), React 19, Tailwind CSS, react-markdown       |
| Backend    | Node.js, Express 4, better-sqlite3, express-validator, bcryptjs, JWT  |
| AI         | Google Gemini (`@google/genai`) with multi-model fallback and retry   |
| Storage    | SQLite (users, resumes, reset codes), local uploads directory         |
| Parsing    | Native PDF support via Gemini, `mammoth` for DOCX → text              |

## Project layout

```
CareerMate-AI/
├── backend/                 # Express API
│   └── src/
│       ├── routes/          # auth, user, onboarding, resume, chat, contact
│       ├── database/        # SQLite schema + migrations
│       ├── middleware/      # requireAuth
│       ├── lib/             # mailer (dev console fallback)
│       └── config/          # env-driven config
└── frontend/                # Next.js app
    └── app/
        ├── components/      # Landing, Auth, Dashboard, Resume, Settings...
        └── lib/api.js       # typed fetch wrapper
```

## Getting started

### Prerequisites

- Node.js **≥ 18**
- A free **Gemini API key** from <https://aistudio.google.com/apikey>

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # then edit .env
npm run dev              # interactive launcher; prints config + starts nodemon
```

Required env vars (see [`backend/.env.example`](backend/.env.example)):

```dotenv
PORT=8000
DATABASE_PATH=./careermate.db
SECRET_KEY=change-this-to-a-long-random-string
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:3000
```

The server starts at `http://localhost:8000` with Swagger docs at `/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>.

If the API isn't on the default port, set `NEXT_PUBLIC_API_BASE_URL` in a `.env.local` inside `frontend/`.

## How the AI flow works

1. User uploads a resume → stored on disk, latest row marked `is_active = 1`.
2. On each chat turn, the backend loads the active resume:
   - **PDF** → base64-encoded `inlineData` part (Gemini reads the real document).
   - **DOCX** → extracted with `mammoth` and wrapped as a text part.
3. System prompt injects the user's onboarding profile (career goal, stage, skills).
4. The response path tries `GEMINI_MODEL` first, then falls back through `gemini-2.0-flash` and `gemini-flash-latest`, with exponential backoff on 503 / 429.

## Password reset (dev mode)

Without SMTP configured, reset codes are printed to the backend terminal:

```
┌─────────────────────────────────────────┐
│  Password reset code (dev — no email)   │
├─────────────────────────────────────────┤
│  To   : user@example.com                │
│  Code : 4823                            │
└─────────────────────────────────────────┘
```

To send real emails, re-add `nodemailer` and configure SMTP (Gmail App Password, Resend, SES, etc.) in `backend/src/lib/mailer.js`.

## Scripts

### Backend

| Command        | What it does                                  |
|----------------|-----------------------------------------------|
| `npm run dev`  | Interactive launcher + nodemon                |
| `npm start`    | Production start (`node src/server.js`)       |

### Frontend

| Command         | What it does           |
|-----------------|------------------------|
| `npm run dev`   | Next.js dev server     |
| `npm run build` | Production build       |
| `npm start`     | Serve production build |
| `npm test`      | Jest component tests   |

## License

ISC — see individual package manifests.
