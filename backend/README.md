# CareerMate AI — Backend

Express + MongoDB API that powers auth, resume storage and Gemini-backed chat for CareerMate AI.

## Tech stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Runtime      | Node.js 22.x                                    |
| Framework    | Express 4                                       |
| Database     | MongoDB Atlas (`mongodb`) + GridFS for files    |
| Auth         | JWT (`jsonwebtoken`) + `bcryptjs`               |
| Validation   | `express-validator`                             |
| AI           | Google Gemini — chat (`@google/genai`) + LangChain adapters (`@langchain/google-genai`) |
| RAG          | LangChain (splitter + embeddings + custom `BaseRetriever`) over Mongo, cosine ranked in JS |
| Agent        | LangGraph (`@langchain/langgraph`) — multi-step classify→retrieve→generate→self-critique loop |
| File parsing | `pdf-parse` (text for RAG) · inline PDF (chat) · `mammoth` (DOCX) |
| Uploads      | `multer` (memory) → GridFS                       |
| Docs         | `swagger-ui-express` at `/docs`                 |

## Project structure

```
backend/
├── src/
│   ├── app.js                # Express app, CORS, routers, error handler
│   ├── server.js             # HTTP listener
│   ├── dev.js                # Interactive dev launcher
│   ├── config/index.js       # Env-driven config
│   ├── database/index.js     # MongoDB connection + GridFS + index setup
│   ├── errors.js             # Typed error classes
│   ├── helpers.js            # catchErrors, validate
│   ├── middleware/auth.js    # requireAuth (JWT → req.user)
│   ├── lib/
│   │   ├── mailer.js         # Password-reset code delivery (dev = console)
│   │   ├── textExtract.js    # PDF/DOCX → plain text (for RAG indexing)
│   │   ├── chunker.js        # LangChain RecursiveCharacterTextSplitter (overlap)
│   │   ├── embeddings.js     # LangChain GoogleGenerativeAIEmbeddings + cosine
│   │   ├── vectorStore.js    # Mongo writes + LangChain BaseRetriever (cosine in JS)
│   │   ├── intentRouter.js   # Heuristic + LLM intent classifier
│   │   ├── promptTemplates.js# 5 task-specific system-prompt templates
│   │   ├── rag.js            # Orchestrator: indexResume / indexJob / retrieve
│   │   └── agent.js          # LangGraph agent (StateGraph + self-critique loop)
│   └── routes/
│       ├── auth.js           # register, login, forgot/verify/reset-password
│       ├── user.js           # profile, career, password update
│       ├── onboarding.js     # first-run profile capture
│       ├── resume.js         # upload (+ index) / list / download / delete
│       ├── chat.js           # Intent-routed RAG → Gemini (single-shot)
│       ├── agent.js          # Multi-step LangGraph agent
│       ├── jobs.js           # JD library CRUD (+ index on create)
│       └── contact.js        # contact form
├── swagger.json              # OpenAPI spec served at /docs
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
MONGODB_URI=your_atlas_connection_string
MONGODB_DB=careermate
SECRET_KEY=change-this-to-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
RAG_TOP_K_RESUME=4
RAG_TOP_K_JOBS=3
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
| POST   | `/chat`                       | JWT  | Intent-routed RAG turn, single-shot (see below) |
| POST   | `/agent`                      | JWT  | Same input as `/chat`; multi-step LangGraph agent |
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

The layer is built on **LangChain components**, but assembled to fit our store. `rag.js` keeps a small stable API (`indexResume` / `indexJob` / `retrieve`) so the routes don't care what's underneath.

**Write path (indexing — runs on upload):**

```
file (PDF/DOCX)
  → textExtract.extractText                  (pdf-parse / mammoth → plain text)
  → chunker.chunkText                        (LangChain RecursiveCharacterTextSplitter, overlap)
  → getEmbeddings('RETRIEVAL_DOCUMENT')      (GoogleGenerativeAIEmbeddings, gemini-embedding-001)
      .embedDocuments(chunks)
  → vectorStore.insertResumeChunks           (embedding stored as a JSON number[] in Mongo)
```

**Read path (retrieval — runs each chat turn):**

```
user message
  → vectorStore.makeResumeRetriever({ userId, topK, embeddings })   (a LangChain BaseRetriever)
       .invoke(query)   → embedQuery + cosine over the user's chunks, top-K
  → vectorStore.makeJobRetriever({ topK, embeddings }).invoke(query) (only when intent benefits)
  → Documents mapped back to `resumeChunks` / `jobChunks` for promptTemplates.buildPrompt
```

**Why a custom retriever instead of `MongoDBAtlasVectorSearch`** — Atlas M0 has no Vector Search, so `vectorStore.js` exposes a `MongoCosineRetriever extends BaseRetriever`: it loads the candidate chunks for the user/library from Mongo and ranks them in JS with a hand-rolled cosine. The rest of the stack (RAG orchestrator *and* the LangGraph agent) just consumes the standard `retriever.invoke(query) → Document[]` interface. When the corpus grows past ~10k vectors, switch to Atlas Vector Search behind the same retriever — a single-file change.

**Tunables** (see `config/index.js` / env):

- `EMBEDDING_MODEL` — default `gemini-embedding-001` (3072-dim; `text-embedding-004` now 404s on the public API).
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

---

### 4 · Agent layer (`src/lib/agent.js`, LangGraph)

`/api/chat` is a single straight-line pass: classify → retrieve → generate → done. `/api/agent` runs the **same** Prompt + RAG building blocks inside a LangGraph `StateGraph` that can *loop* — the difference between a pipeline and an agent.

```
START → classify → retrieve → generate → critiqueDraft ──grounded?──→ finalize → END
                      ▲                        │
                      └──────── not grounded ──┘   (re-retrieve + redraft, up to 2 attempts)
```

- **classify / retrieve / generate** reuse `intentRouter`, `rag.retrieve`, and `promptTemplates` — no duplicated logic.
- **critiqueDraft** is a cheap LLM self-check (Gemini in JSON mode → `{ grounded, feedback }`): is every claim about the candidate backed by the retrieved resume context?
- **the loop** — if the draft isn't grounded, the critique feedback is folded into a fresh retrieval query and the model redrafts. Capped at `MAX_ATTEMPTS` (2) so it can't spin.

Request shape is identical to `/api/chat` (`{ message, history }`). The response adds agent diagnostics:

```jsonc
{
  "reply": "...",
  "intent": "career_planning",
  "attempts": 1,
  "grounded": true,
  "steps": ["classify:career_planning", "retrieve:r4/j0", "generate:#1", "critique:ok", "finalize"],
  "retrieval": { "resume_chunks": [...], "job_chunks": [...] }
}
```

`/api/chat` stays the default low-latency path; `/api/agent` is the higher-quality, self-correcting one. They coexist so you can compare them on the same input.

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

MongoDB lives in `src/database/index.js`: `connect()` lazily opens the Atlas client, sets up a GridFS bucket for uploaded files, and calls `ensureIndexes()`. The `collections.*()` accessors are used throughout the app.

| Collection | Purpose |
|------------|---------|
| `users` | Account + denormalized career profile fields |
| `onboarding_profiles` | First-run answers (one-to-one with users) |
| `resumes` | Resume metadata; the file bytes live in GridFS (`resumes` bucket) |
| `resume_chunks` | RAG: chunked resume text + embedding (`number[]`), indexed by `user_id` / `resume_id` |
| `jobs` | JD library (shared across users) |
| `job_chunks` | RAG: chunked JD text + embedding (`number[]`), indexed by `job_id` |
| `password_reset_codes` | 4-digit codes with 15-minute expiry (TTL index) |
| `contact_messages` | Contact form submissions |
