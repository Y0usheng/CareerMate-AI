# CareerMate AI — Backend

FastAPI backend for CareerMate AI, providing authentication, user profiles, onboarding, resume management, and AI-powered career coaching chat.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Validation | Pydantic v2 |

## Project Structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, router registration
│   ├── config.py          # Settings (pydantic-settings + .env)
│   ├── database.py        # SQLAlchemy engine & session
│   ├── core/
│   │   ├── security.py    # JWT creation/decode, password hashing
│   │   └── deps.py        # get_current_user dependency
│   ├── models/            # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── onboarding.py
│   │   ├── resume.py
│   │   ├── contact.py
│   │   └── password_reset.py
│   ├── schemas/           # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── onboarding.py
│   │   ├── resume.py
│   │   ├── chat.py
│   │   └── contact.py
│   └── routers/           # Route handlers
│       ├── auth.py
│       ├── user.py
│       ├── onboarding.py
│       ├── resume.py
│       ├── chat.py
│       └── contact.py
├── uploads/               # Uploaded resume files (git-ignored)
├── requirements.txt
├── .env.example
└── README.md
```

## Quick Start

### 1. Create virtual environment

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and set your ANTHROPIC_API_KEY and SECRET_KEY
```

### 4. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Login, get JWT | No |
| POST | `/api/auth/forgot-password` | Request reset code | No |
| POST | `/api/auth/verify-code` | Verify 4-digit code | No |
| POST | `/api/auth/reset-password` | Set new password | No |

### User — `/api/user`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/user/profile` | Get current user | Yes |
| PUT | `/api/user/profile` | Update basic info | Yes |
| PUT | `/api/user/career` | Update career settings | Yes |
| PUT | `/api/user/password` | Change password | Yes |

### Onboarding — `/api/onboarding`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/onboarding` | Save onboarding data | Yes |
| GET | `/api/onboarding` | Get onboarding data | Yes |

### Resume — `/api/resume`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/resume/upload` | Upload PDF/DOC/DOCX | Yes |
| GET | `/api/resume` | Get active resume info | Yes |
| DELETE | `/api/resume` | Delete active resume | Yes |

### Chat — `/api/chat`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/chat` | Send message, get AI reply | Yes |

**Request body:**
```json
{
  "message": "Summarize my resume and suggest three improvements.",
  "history": [
    { "role": "user", "text": "..." },
    { "role": "assistant", "text": "..." }
  ]
}
```

### Contact — `/api/contact`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/contact` | Submit contact form | No |

---

## Authentication

All protected endpoints expect a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

The token is returned by `/api/auth/login` and `/api/auth/register`.

---

## Frontend Integration

Add this to your frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then make API calls:

```js
// Register
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ full_name, email, password }),
});
const data = await res.json();
// data.access_token  ← store this

// Authenticated request
const profile = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Password Reset Flow

1. `POST /api/auth/forgot-password` with `{ email }` → code logged to console in dev
2. `POST /api/auth/verify-code` with `{ email, code }` → validates code
3. `POST /api/auth/reset-password` with `{ email, code, password, confirm_password }` → updates password

> In production, replace the `print()` in `routers/auth.py` with an email service (e.g. SendGrid, Resend).
