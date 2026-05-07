# CareerMate AI — Backend

Express + SQLite API that powers auth, resume storage and Gemini-backed chat for CareerMate AI.

## Tech stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Runtime      | Node.js ≥ 18                                    |
| Framework    | Express 4                                       |
| Database     | SQLite via `better-sqlite3`                     |
| Auth         | JWT (`jsonwebtoken`) + `bcryptjs`               |
| Validation   | `express-validator`                             |
| AI           | Google Gemini (`@google/genai`) — chat + embeddings |
| RAG          | In-process retrieval over SQLite BLOB embeddings (cosine) |
| File parsing | `pdf-parse` (text for RAG) · inline PDF (chat) · `mammoth` (DOCX) |
| Uploads      | `multer` disk storage                           |
| Docs         | `swagger-ui-express` at `/docs`                 |

## Project structure

```
backend/
├── src/
│   ├── app.js                # Express app, CORS, routers, error handler
│   ├── server.js             # HTTP listener
│   ├── dev.js                # Interactive dev launcher
│   ├── config/index.js       # Env-driven config
│   ├── database/index.js     # SQLite connection + schema migrations
│   ├── errors.js             # Typed error classes
│   ├── helpers.js            # catchErrors, validate
│   ├── middleware/auth.js    # requireAuth (JWT → req.user)
│   ├── lib/
│   │   ├── mailer.js         # Password-reset code delivery (dev = console)
│   │   ├── textExtract.js    # PDF/DOCX → plain text (for RAG indexing)
│   │   ├── chunker.js        # Paragraph-aware text splitter w/ overlap
│   │   ├── embeddings.js     # Gemini embedding client + cosine + BLOB codec
│   │   ├── vectorStore.js    # SQLite-backed vector storage + cosine ranking
│   │   ├── intentRouter.js   # Heuristic + LLM intent classifier
│   │   ├── promptTemplates.js# 5 task-specific system-prompt templates
│   │   └── rag.js            # Orchestrator: indexResume / indexJob / retrieve
│   └── routes/
│       ├── auth.js           # register, login, forgot/verify/reset-password
│       ├── user.js           # profile, career, password update
│       ├── onboarding.js     # first-run profile capture
│       ├── resume.js         # upload (+ index) / list / download / delete
│       ├── chat.js           # Intent-routed RAG → Gemini
│       ├── jobs.js           # JD library CRUD (+ index on create)
│       └── contact.js        # contact form
├── swagger.json              # OpenAPI spec served at /docs
├── uploads/                  # user-uploaded files (gitignored)
├── careermate.db             # SQLite file (gitignored)
└── .env                      # secrets (gitignored; see .env.example)
```

## Getting started

```bash
npm install
cp .env.example .env     # then edit values
npm run dev              # interactive launcher + nodemon
```

Required env vars:

```dotenv
PORT=8000
DATABASE_PATH=./careermate.db
SECRET_KEY=change-this-to-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=text-embedding-004
RAG_TOP_K_RESUME=4
RAG_TOP_K_JOBS=3
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=10
FRONTEND_URL=http://localhost:3000
```

After `npm run dev` the API is at `http://localhost:8000` and Swagger UI at `http://localhost:8000/docs`.

## Scripts

| Command        | What it does                            |
|----------------|-----------------------------------------|
| `npm run dev`  | Interactive launcher, then nodemon      |
| `npm start`    | Production start (`node src/server.js`) |

## API overview

All routes are prefixed with `/api`.

| Method | Path                          | Auth | Purpose                                |
|--------|-------------------------------|------|----------------------------------------|
| POST   | `/auth/register`              | —    | Create account                         |
| POST   | `/auth/login`                 | —    | Email + password → JWT                 |
| POST   | `/auth/forgot-password`       | —    | Generate + deliver 4-digit reset code  |
| POST   | `/auth/verify-code`           | —    | Validate code without consuming it     |
| POST   | `/auth/reset-password`        | —    | Consume code, set new password         |
| GET    | `/user/profile`               | JWT  | Current user                           |
| PUT    | `/user/profile`               | JWT  | Update name / email / field            |
| PUT    | `/user/career`                | JWT  | Update career goal / stage / skills    |
| PUT    | `/user/password`              | JWT  | Change password (requires current)     |
| GET    | `/onboarding`                 | JWT  | Get onboarding state                   |
| POST   | `/onboarding`                 | JWT  | Submit onboarding answers              |
| POST   | `/resume/upload`              | JWT  | Upload PDF / DOC / DOCX (≤10MB)        |
| GET    | `/resume`                     | JWT  | List uploaded resumes                  |
| GET    | `/resume/:id/download`        | JWT  | Stream original file                   |
| DELETE | `/resume/:id`                 | JWT  | Delete resume + file                   |
| POST   | `/chat`                       | JWT  | Intent-routed RAG turn (see below)     |
| POST   | `/jobs`                       | JWT  | Add JD to library (auto-indexed)       |
| GET    | `/jobs`                       | JWT  | List JD library                        |
| GET    | `/jobs/:id`                   | JWT  | Get one JD                             |
| DELETE | `/jobs/:id`                   | JWT  | Delete JD (chunks cascade)             |
| POST   | `/contact`                    | —    | Contact form submissions               |

## API + Prompt engineering + RAG

This backend is structured around three layered concerns. Each one solves a problem the next layer assumes is already solved.

```
┌─────────────────────────────────────────────────────────────────┐
│  API layer        Express routes — auth, validation, transport  │
├─────────────────────────────────────────────────────────────────┤
│  Prompt layer     Intent routing → task-specific system prompts │
├─────────────────────────────────────────────────────────────────┤
│  RAG layer        Chunk → embed → store → retrieve → ground     │
└─────────────────────────────────────────────────────────────────┘
```

### Why each layer exists

| Layer  | Without it… | What it gives the next layer |
|--------|-------------|------------------------------|
| **API** | The model has no users, no auth, no files, no persistence. | A clean, validated request carrying `user`, `message`, and chat history. |
| **Prompt** | The model treats every question the same way and produces generic, ungrounded advice. | A task-specific system instruction with a defined output contract. |
| **RAG**    | The model only sees the user's question — not the resume content that should ground the answer. Re-uploading the entire PDF every turn is slow and wastes context. | A handful of *relevant* resume chunks (and JD matches when useful), retrieved by semantic similarity. |

---

### 1 · API layer (`src/routes/`)

Plain REST over Express. Two endpoints carry the AI work:

- **`POST /api/resume/upload`** — multer writes the file to disk, the row is inserted, then the upload handler runs the indexing pipeline **synchronously** so the very next chat turn already has retrievable chunks. Indexing failure is logged but does not fail the upload (chat still has the inline-PDF fallback).
- **`POST /api/chat`** — accepts `{ message, history }`, runs the full Prompt + RAG pipeline, and returns `{ reply, intent, retrieval }`. The `retrieval` block surfaces which chunks scored highest, which is useful for debugging and for the UI to show "sources".
- **`POST /api/jobs`** — adds a job description to the shared library and indexes it immediately.

All routes are guarded by `requireAuth` (JWT → `req.user`), validated with `express-validator`, and wrapped in `catchErrors` so async failures surface through the global error handler.

---

### 2 · Prompt layer (`src/lib/intentRouter.js`, `src/lib/promptTemplates.js`)

A single mega-prompt has to be either too vague (works for everything badly) or too rigid (works for one thing well, breaks the rest). We split the problem in two:

**Intent classification** — `intentRouter.js` decides *what kind of help the user is asking for* before we generate anything. It runs a two-tier strategy:

1. Cheap regex heuristics for the obvious cases (`/interview/i`, `/rewrite/i`, `面试`, `职业规划`, …) — zero latency, zero cost.
2. If nothing matches, fall back to a tiny Gemini call (`temperature: 0`, `maxOutputTokens: 8`) that emits a single label.

The output is one of five intents:

| Intent             | Triggered by examples |
|--------------------|------------------------|
| `resume_rewrite`   | "rewrite this bullet", "improve my resume", "改写经历" |
| `interview_prep`   | "mock interview", "behavioral question", "如何回答" |
| `job_match`        | "am I qualified for this JD?", "岗位匹配度" |
| `career_planning`  | "5-year plan", "transition into …", "下一步" |
| `general`          | anything else — the safe default |

**Template registry** — `promptTemplates.js` holds one system-prompt builder per intent. Each template:

- Embeds the user's onboarding profile (name, field, goal, stage, skills).
- Embeds the retrieved resume chunks (and JD matches when the intent benefits from them — match / interview / planning).
- States a per-intent **output contract** so the model stops improvising shape:
  - `resume_rewrite` → `Before:` / `After:` pairs, STAR pattern, suggested metrics, "why this is stronger" line.
  - `interview_prep` → tagged questions ([Behavioral] / [Technical] / [Situational]) or STAR critique.
  - `job_match` → fit score (Strong / Moderate / Weak), strengths, gaps, concrete tweaks.
  - `career_planning` → 3 / 12 / 24-month milestones with skills to build.
- Carries a shared `Grounding rules` block: cite chunks, refuse to invent facts, ask for a resume upload if context is empty.

This is why the chat answers stay structured and on-topic instead of drifting into LinkedIn-flavoured generalities.

---

### 3 · RAG layer (`src/lib/{textExtract,chunker,embeddings,vectorStore,rag}.js`)

RAG = **R**etrieval-**A**ugmented **G**eneration: at query time, find the most relevant pieces of the user's documents and put *those* into the prompt instead of the whole document. It solves three problems for us:

- **Faithfulness** — answers can quote real bullets from the user's resume, not hallucinated experience.
- **Cost / latency** — the model reads ~4 short chunks instead of a multi-page PDF every turn.
- **Cross-document reasoning** — the same retrieval call can pull resume chunks *and* JD chunks, enabling "match my resume to this role" without bespoke logic.

**Write path (indexing — runs on upload):**

```
file (PDF/DOCX)
  → textExtract.extractText      (pdf-parse / mammoth → plain text)
  → chunker.chunkText            (~900 char chunks, paragraph-aware, 150 char overlap)
  → embeddings.embedMany         (Gemini text-embedding-004, RETRIEVAL_DOCUMENT)
  → vectorStore.insertResumeChunks  (Float32Array → BLOB in SQLite)
```

**Read path (retrieval — runs each chat turn):**

```
user message
  → embeddings.embedOne(query, RETRIEVAL_QUERY)
  → vectorStore.searchResumeChunks (cosine over user's chunks, top-K)
  → vectorStore.searchJobChunks    (cosine over JD library, top-K, only when intent benefits)
  → handed to promptTemplates.buildPrompt as `resumeChunks` / `jobChunks`
```

**Storage** — embeddings live in SQLite as `BLOB` columns (raw `Float32Array` bytes). We rank in JS with a hand-rolled cosine. This is deliberate:

- Zero extra dependencies, zero native build steps (important on Windows).
- Plenty fast for the working set (one user's resume = a handful of chunks; JD library = dozens-to-hundreds).
- `vectorStore.js` is the only file that knows storage details. When the corpus grows past ~10k vectors, swapping to `sqlite-vec` virtual tables or pgvector is a single-file change.

**Tunables** (see `config/index.js` / env):

- `EMBEDDING_MODEL` — default `text-embedding-004`.
- `RAG_TOP_K_RESUME` — chunks pulled from the user's resume per turn (default 4).
- `RAG_TOP_K_JOBS` — chunks pulled from the JD library per turn (default 3).

---

### End-to-end: one chat request

```
POST /api/chat { message, history }
        │
        ▼
┌──────────────────┐  intent ∈ { resume_rewrite | interview_prep |
│ classifyIntent   │             job_match | career_planning | general }
└──────────────────┘
        │
        ▼
┌──────────────────┐  embed(message) → cosine search
│ rag.retrieve     │  → resumeChunks (top-K) + jobChunks (when relevant)
└──────────────────┘
        │
        ▼
┌──────────────────┐  Pick template by intent. Inject:
│ buildPrompt      │   • user profile  • resume chunks  • job chunks
│                  │   • shared grounding rules  • output contract
└──────────────────┘
        │
        ▼
┌──────────────────┐  contents = history + [resume inline part + message]
│ Gemini           │  systemInstruction = template output
│ generateContent  │  fallback chain: GEMINI_MODEL → 2.0-flash → flash-latest
└──────────────────┘  retries on 503 / 429 with exponential backoff
        │
        ▼
{ reply, intent, retrieval: { resume_chunks: [...], job_chunks: [...] } }
```

The response includes `intent` and the per-chunk relevance scores so the frontend (or you, while debugging) can see *why* the model said what it said.

## Password reset — dev mode

When SMTP is not configured, codes are printed to the server console instead of emailed:

```
┌─────────────────────────────────────────┐
│  Password reset code (dev — no email)   │
├─────────────────────────────────────────┤
│  To   : user@example.com                │
│  Code : 4823                            │
└─────────────────────────────────────────┘
```

To deliver real email, reintroduce `nodemailer` (or a provider like Resend) inside `src/lib/mailer.js` and fill the matching SMTP env vars.

## Database

Schema and lightweight migrations live in `src/database/index.js` — on import, the module connects to `config.databasePath` and ensures all tables exist.

| Table | Purpose |
|-------|---------|
| `users` | Account + denormalized career profile fields |
| `onboarding_profiles` | First-run answers (one-to-one with users) |
| `resumes` | Uploaded files, with `is_active = 1` marking the latest |
| `resume_chunks` | RAG: chunked resume text + embedding BLOB (FK → resumes, cascades on delete) |
| `jobs` | JD library (shared across users) |
| `job_chunks` | RAG: chunked JD text + embedding BLOB (FK → jobs, cascades) |
| `password_reset_codes` | 4-digit codes with 15-minute expiry |
| `contact_messages` | Contact form submissions |
