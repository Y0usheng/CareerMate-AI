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
| AI           | Google Gemini (`@google/genai`)                 |
| File parsing | Native PDF (sent inline to Gemini) · `mammoth` for DOCX |
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
│   ├── lib/mailer.js         # Password-reset code delivery (dev = console)
│   └── routes/
│       ├── auth.js           # register, login, forgot/verify/reset-password
│       ├── user.js           # profile, career, password update
│       ├── onboarding.js     # first-run profile capture
│       ├── resume.js         # upload / list / download / delete
│       ├── chat.js           # Gemini chat with resume as inline part
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
| POST   | `/chat`                       | JWT  | Gemini turn with latest resume inlined |
| POST   | `/contact`                    | —    | Contact form submissions               |

## AI chat flow

1. `/api/chat` loads the user's active resume row (`is_active = 1`).
2. **PDF** → base64-encoded `inlineData` part so Gemini reads the real document (layout, dates, headings). **DOCX** → text extracted with `mammoth` and wrapped as a text part. `.doc` is not supported.
3. A system prompt injects the user's onboarding context (career goal, stage, skills).
4. Model chain: `config.geminiModel` → `gemini-2.0-flash` → `gemini-flash-latest`, with up to 3 retries and exponential backoff on `503 / 429 / UNAVAILABLE`.

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

Schema and lightweight migrations live in `src/database/index.js` — on import, the module connects to `config.databasePath` and ensures all tables exist. Tables: `users`, `onboarding`, `resumes`, `password_reset_codes`, `contact_messages`.
