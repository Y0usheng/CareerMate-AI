# CareerMate AI — Frontend

Next.js frontend for CareerMate AI — an AI-powered career coaching platform for resume review, mock interviews, and career guidance.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Language | JavaScript (JSX) |

## Project Structure

```
frontend/
├── app/
│   ├── page.js                    # / Landing page
│   ├── login/page.js              # /login
│   ├── register/page.js           # /register
│   ├── forgot-password/page.js    # /forgot-password
│   ├── dashboard/page.js          # /dashboard
│   ├── onboarding/page.js         # /onboarding
│   ├── settings/page.js           # /settings
│   ├── layout.js                  # Root layout
│   └── components/
│       ├── Auth/                  # Shared login & register UI
│       │   ├── Page/              # AuthPage (mode="login"|"register")
│       │   ├── components/
│       │   │   ├── AuthField/     # Input field with validation
│       │   │   ├── AuthForm/      # Login / Register form logic
│       │   │   ├── AuthHeader/    # Logo + title
│       │   │   └── AuthShowcase/  # Right-panel decorative showcase
│       │   │       └── assets/    # background.png
│       │   └── data.js            # Form field definitions
│       ├── Dashboard/             # Main dashboard (chat + resume)
│       ├── ForgotPassword/        # 4-step password reset wizard
│       ├── Landing/               # Marketing landing page
│       │   └── components/
│       │       ├── Header/        # Nav bar
│       │       ├── Hero/          # Hero section
│       │       ├── Problem/       # Problem statement
│       │       ├── Features/      # Feature cards
│       │       ├── Demo/          # Demo section
│       │       ├── TechStack/     # Tech stack display
│       │       ├── Testimonials/  # User testimonials
│       │       ├── Contact/       # Contact form
│       │       ├── CallToAction/  # CTA section
│       │       ├── Footer/        # Footer
│       │       └── BackToTop/     # Scroll-to-top button
│       ├── Onboarding/            # 5-step onboarding wizard
│       └── Settings/              # Profile, career & security settings
└── public/
    └── landing/                   # Landing page images and SVGs
```

## Pages & Features

### Landing (`/`)
Marketing page with Hero, Features, Demo, Testimonials, and Contact form sections.

### Auth (`/login`, `/register`)
Shared two-panel layout — form on the left, decorative showcase on the right.

**Register fields:** Full Name, Email, Password (min 8 chars)
**Login fields:** Email, Password, Remember me

### Forgot Password (`/forgot-password`)
4-step wizard:
1. Enter email
2. Enter 4-digit verification code
3. Set new password
4. Success confirmation

### Dashboard (`/dashboard`)
- Resume upload (PDF / DOC / DOCX)
- AI chat interface with starter prompts
- Sidebar navigation (Home, Resume, Settings)

### Onboarding (`/onboarding`)
5-step guided setup:
1. Welcome
2. Basic info (name, role, field)
3. Skill selection (multi-select)
4. Career goal & stage
5. Completion → redirect to dashboard

### Settings (`/settings`)
Three tabs:
- **Basic Information** — name, email, field
- **Career & Learning** — career goal, stage, skills
- **Account Security** — change password

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Backend Integration

All forms currently use mock delays. To wire up the real backend:

1. Set `NEXT_PUBLIC_API_URL` in `.env.local`
2. Replace `setTimeout` calls with `fetch` to the corresponding API endpoint

**Example — Register:**
```js
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ full_name, email, password }),
});
const data = await res.json();
// Store data.access_token (localStorage / cookie)
```

**Example — Authenticated request:**
```js
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

See [backend/README.md](../backend/README.md) for the full API reference.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (webpack mode) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
