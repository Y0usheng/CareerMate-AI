# CareerMate AI

An AI-powered career coach built around your resume. Upload a PDF / DOCX, ask questions, and get tailored suggestions for bullet-point rewrites, role targeting, and interview prep — all grounded in the actual document you uploaded.

![Status](https://img.shields.io/badge/status-in%20development-blue)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-green)
![Frontend](https://img.shields.io/badge/frontend-Next.js%2015-black)
![AI](https://img.shields.io/badge/AI-Gemini%202.5-4285F4)

## Features

- **Chat with your resume (RAG).** Uploaded resumes are chunked, embedded and retrieved by semantic similarity each turn, with the full PDF inlined to Gemini as a safety net so nothing is lost.
- **Multi-step agent.** An optional LangGraph agent (`/api/agent`) classifies intent, retrieves context, drafts an answer, then self-checks grounding and re-drafts if needed — toggle it on from the chat composer.
- **Job library + matching.** Save target job descriptions; the coach retrieves them to score fit, surface gaps, and tailor interview prep against your resume.
- **Conversation history.** Sidebar keeps your past chats, grouped by topic, persisted locally.
- **Auth + onboarding.** Email/password accounts, JWT sessions, first-run onboarding that feeds context into every prompt.
- **Password reset.** 4-digit code flow with 15-minute expiry, single-use codes, dev-mode console output (swap in SMTP/Resend for production).
- **Resume management.** Upload / replace / delete, with only the latest marked active.
- **Consistent UI shell.** Dashboard, Resume, Jobs and Settings all share the same sidebar, account card and icon-only log-out to prevent misclicks.

## Tech stack

| Layer      | Stack                                                                 |
|------------|-----------------------------------------------------------------------|
| Frontend   | Next.js 15 (App Router), React 19, Tailwind CSS, react-markdown       |
| Backend    | Node.js 22, Express 4, express-validator, bcryptjs, JWT               |
| AI         | Google Gemini — chat (`@google/genai`) + LangChain RAG + LangGraph agent |
| Storage    | MongoDB Atlas (users, resumes, job library, embeddings) + GridFS for files |
| Parsing    | Native PDF support via Gemini, `mammoth` for DOCX → text              |

## Project layout

```
CareerMate-AI/
├── backend/                 # Express API
│   └── src/
│       ├── routes/          # auth, user, onboarding, resume, chat, agent, jobs, contact
│       ├── database/        # MongoDB connection + GridFS + index setup
│       ├── middleware/      # requireAuth
│       ├── lib/             # RAG (chunker/embeddings/vectorStore/rag), agent (LangGraph), mailer
│       └── config/          # env-driven config
└── frontend/                # Next.js app
    └── app/
        ├── components/      # Landing, Auth, Dashboard, Resume, Jobs, Settings...
        └── lib/api.js       # typed fetch wrapper
```

## Getting started

### Prerequisites

- Node.js **22.x**
- A **MongoDB Atlas** connection string (free M0 tier works)
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
MONGODB_URI=your_atlas_connection_string
MONGODB_DB=careermate
SECRET_KEY=change-this-to-a-long-random-string
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
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

1. **Upload (indexing).** The resume file is streamed into GridFS and the latest row is marked `is_active`. Its text is chunked, embedded (`gemini-embedding-001`) and stored in MongoDB for retrieval. Job descriptions are indexed the same way.
2. **Chat turn (`/api/chat`).** The backend classifies intent, retrieves the most relevant resume (and job-library) chunks by cosine similarity, and builds an intent-specific, grounded system prompt. The full PDF/DOCX is still inlined as a safety net.
3. **Profile context.** The user's onboarding profile (career goal, stage, skills) is injected into every prompt.
4. **Generation.** The response path tries `GEMINI_MODEL` first, then falls back through `gemini-2.0-flash` and `gemini-flash-latest`, with exponential backoff on 503 / 429.
5. **Agent turn (`/api/agent`).** Optionally, a LangGraph agent runs classify → retrieve → generate → grounding self-check, looping back to re-retrieve and re-draft when a claim isn't supported (falls back to inlining the full resume when retrieval is empty).

> RAG, prompt-engineering and the agent graph are documented in depth in [`backend/README.md`](backend/README.md).

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
