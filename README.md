# Oquvi ⚡ Collaborative Project Workspace

> **Modern SaaS Workspace** built with **React 19**, **TypeScript**, **Vite**, and **Supabase Auth**.

Oquvi is a collaborative workspace frontend engineered with a white and soft lavender design aesthetic, electric indigo accents, clean typography, rounded cards, and subtle micro-animations.

---

## 🎨 Visual Identity & Design System

- **Background Palette:** Clean white (`#ffffff`) and soft lavender mist (`#faf8ff`, `#ede9fe`, `#f3f0ff`).
- **Brand Accents:** Electric Indigo (`#4f46e5`, `#4338ca`) and Violet gradients.
- **Card Styling:** Rounded corners (`18px` radius), soft multi-layered shadows, and hairline borders.
- **Typography:** Inter with modern visual hierarchy and high readability contrast.

---

## 🔐 Supabase Authentication Setup

Oquvi uses real Supabase Auth for user signup, login, session persistence, and protected routes.

### How to Configure Supabase Credentials:

1. **Sign in to Supabase:** Go to [supabase.com/dashboard](https://supabase.com/dashboard) and open or create a project.
2. **Retrieve API Keys:**
   - In the left sidebar, click **Project Settings** (gear icon) -> **API**.
   - Copy the **Project URL** (e.g., `https://abcdefghijklm.supabase.co`).
   - Copy the **Project API Keys** -> **`anon` `public`** key.
   > ⚠️ **Security Notice:** Never use or expose your `service_role` secret key in frontend code.
3. **Configure Your Local `.env` File:**
   Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
   Paste your real credentials into `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-real-anon-public-key
   ```
   *(Note: `.env` is already configured in `.gitignore` so your secrets will never be committed to Git).*
4. **Email Confirmation Setting (Optional for Testing):**
   - In the Supabase Dashboard, go to **Authentication** -> **Providers** -> **Email**.
   - If you want new signups to log in immediately without waiting for an email verification link, toggle off **"Confirm email"**.

---

## 🗺️ Application Views & Routing

| Route | Page | Access Level | Key Features |
| :--- | :--- | :--- | :--- |
| `/` | **Landing Page** | Public | Marketing hero, interactive live board preview, feature pillars, dual CTA buttons |
| `/login` | **Login Page** | Public | Email/password login with Supabase, validation, error messages, and loading states |
| `/signup` | **Sign Up Page** | Public | New account registration with full name, password match validation, and email notice |
| `/dashboard` | **Dashboard** | Protected 🔒 | Welcome banner, 4 KPI StatCards, featured projects with progress bars, and live activity stream |
| `/projects` | **Projects Catalog** | Protected 🔒 | Filter tabs (All, In Progress, Planning, Completed), search filter, and "+ Create Project" modal |
| `/workspace` | **Sprint Kanban Board** | Protected 🔒 | **To Do**, **In Progress**, **Completed** columns, card status shifting, priority filters, and "+ Add Task" modal |
| `/team` | **Team Members** | Protected 🔒 | Teammate directory with Indian names, presence tags, department filters, search, and "+ Invite Teammate" modal |
| `/notifications` | **Notifications** | Protected 🔒 | Tabs (All, Unread, Mentions, System), mark all as read, dismiss notification, and alert cards |
| `/settings` | **Settings** | Protected 🔒 | User profile preferences, workspace name/slug, and notification alert checkboxes with save feedback |

---

## ⚡ How to Run Locally

```powershell
# 1. Start Vite development server
npm.cmd run dev
# (or 'npm run dev' if PowerShell execution policy is bypassed)

# 2. Verify TypeScript types and production build
npm.cmd run build

# 3. Run linter
npm.cmd run lint
```

Access the app in your browser at: **`http://localhost:5174/`**
- Unauthenticated visits to `/dashboard`, `/projects`, etc. automatically redirect to `/login`.
- Authenticated users can log out via the user profile menu in the top navbar or sidebar footer.

---

## 📁 Maintainable Architecture

```text
src/
├── components/
│   ├── auth/                # ProtectedRoute guard component
│   ├── common/              # Reusable UI primitives (Button, Card, Badge, Avatar, Input, StatCard)
│   └── layout/              # Shell chrome (AppLayout, Navbar with User Profile Menu, Sidebar with Logout)
├── context/                 # AuthContext & useAuth hook managing Supabase session
├── data/                    # Realistic seed data with Indian names (CampusConnect, SevaSetu, StudySync, EventMitra)
├── lib/                     # Supabase client initializer (lib/supabase.ts)
├── pages/                   # Application views (Landing, Login, Signup, Dashboard, Projects, Workspace, Team, Notifications, Settings)
├── routes/                  # AppRoutes configuration (Public + Protected)
├── styles/                  # CSS tokens (White & Soft Lavender palette, rounded cards)
└── types/                   # TypeScript interfaces (User, Project, Task, AppNotification, etc.)
```
