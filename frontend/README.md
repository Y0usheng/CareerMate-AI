# CareerMate AI — Frontend

Next.js App Router UI for CareerMate AI: landing page, auth, onboarding, resume coach chat, resume management and settings.

## Tech stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Framework   | Next.js 15 (App Router)                     |
| UI          | React 19                                    |
| Styling     | Tailwind CSS                                |
| Markdown    | `react-markdown` + `remark-gfm` (chat)      |
| Testing     | Jest + React Testing Library                |
| Language    | JavaScript (JSX), one `.tsx` root layout    |

## Project structure

```
frontend/
├── app/
│   ├── layout.tsx                # Root layout, fonts, metadata
│   ├── page.js                   # / Landing
│   ├── login/page.js             # /login
│   ├── register/page.js          # /register
│   ├── forgot-password/page.js   # /forgot-password (3-step flow)
│   ├── onboarding/page.js        # /onboarding
│   ├── dashboard/page.js         # /dashboard (chat)
│   ├── resume/page.js            # /resume
│   ├── settings/page.js          # /settings
│   ├── globals.css               # Tailwind + .prose-chat styles
│   ├── lib/api.js                # Fetch wrapper + all API calls
│   └── components/
│       ├── Landing/              # Hero, Features, Testimonials, …
│       ├── Auth/                 # Login / signup (shared AuthPage)
│       ├── ForgotPassword/       # Email → code → new password
│       ├── Onboarding/           # First-run profile capture
│       ├── Dashboard/            # Sidebar + chat with Gemini
│       ├── Resume/               # Upload / list / delete
│       ├── Settings/             # Basic / Career / Security tabs
│       └── Shared/               # MobileShell, PasswordInput, …
├── __tests__/                    # Jest component tests
├── public/                       # Static assets
├── next.config.mjs
├── tailwind.config.js
└── jest.config.js
```

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

By default the frontend talks to `http://localhost:8000/api`. Override with a `.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

Make sure the [backend](../backend/README.md) is running first.

## Scripts

| Command         | What it does              |
|-----------------|---------------------------|
| `npm run dev`   | Next.js dev server (HMR)  |
| `npm run build` | Production build          |
| `npm start`     | Serve production build    |
| `npm test`      | Jest + RTL component tests|
| `npm run lint`  | Next / ESLint             |

## Key flows

- **Auth.** `login` / `register` share the `AuthPage` component; tokens stored in `localStorage` via `lib/api.js`.
- **Password reset.** 3 steps (email → 4-digit code → new password), each wired to `/api/auth/forgot-password` · `/verify-code` · `/reset-password`. All password inputs use the shared `Shared/PasswordInput` with a show/hide eye toggle.
- **Dashboard.** Left sidebar keeps conversation history (persisted to `localStorage` under `careermate_chats`). Upload a resume via the paperclip in the composer — backend stores it and flags it active so every subsequent chat turn includes it. Assistant replies render as GFM markdown.
- **Consistent shell.** Dashboard, Resume and Settings share sidebar width, icon-based nav and an icon-only logout to reduce misclicks. Mobile uses `Shared/MobileShell` for the drawer.

## Styling notes

Tailwind is configured for arbitrary values (used extensively in shadows and gradients). Chat markdown is scoped through a custom `.prose-chat` class in `globals.css` so headings, lists, code blocks and tables stay readable inside a speech bubble.

## Testing

```bash
npm test
```

Tests live in `__tests__/` and cover the auth and password-reset flows. Jest is configured via `jest.config.js` with `@testing-library/react` and a JSDOM environment.
