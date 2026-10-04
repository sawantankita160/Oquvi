# TeamFlow ⚡ Collaborative Project Workspace

> **Modern SaaS Workspace** built with **React 19**, **TypeScript**, and **Vite**.

TeamFlow is a collaborative workspace frontend engineered with a white and soft lavender design aesthetic, electric indigo accents, clean typography, rounded cards, and subtle micro-animations.

---

## 🎨 Visual Identity & Design System

- **Background Palette:** Clean white (`#ffffff`) and soft lavender mist (`#faf8ff`, `#ede9fe`, `#f3f0ff`).
- **Brand Accents:** Electric Indigo (`#4f46e5`, `#4338ca`) and Violet gradients.
- **Card Styling:** Rounded corners (`18px` radius), soft multi-layered shadows, and hairline borders.
- **Typography:** Inter with modern visual hierarchy and high readability contrast.

---

## 🗺️ Application Views & Routing

| Route | Page | Key Features |
| :--- | :--- | :--- |
| `/` | **Landing Page** | Marketing hero, interactive live board preview mockup, feature value pillars, sprint metrics, dual CTA buttons |
| `/dashboard` | **Dashboard** | Welcome banner, 4 KPI StatCards, featured projects with progress bars, and live activity stream |
| `/projects` | **Projects Catalog** | Filter tabs (All, In Progress, Planning, Completed), search filter, and "+ Create Project" modal dialog |
| `/workspace` | **Sprint Kanban Board** | **To Do**, **In Progress**, **Completed** columns, card status shifting, priority filters, and "+ Add Task" modal |
| `/team` | **Team Members** | Teammate directory, online presence tags, department filters, search, and "+ Invite Teammate" modal |
| `/notifications` | **Notifications** | Tabs (All, Unread, Mentions, System), mark all as read, dismiss notification, and alert cards |
| `/settings` | **Settings** | User profile preferences, workspace name/slug, and notification alert checkboxes with save feedback |

---

## ⚡ How to Run Locally

```powershell
# Start Vite development server
npm.cmd run dev
# (or 'npm run dev' if PowerShell execution policy is bypassed)

# Verify TypeScript types and production build
npm.cmd run build

# Run linter
npm.cmd run lint
```

Access the app in your browser at: **`http://localhost:5174/`**

---

## 📁 Maintainable Architecture

```text
src/
├── components/
│   ├── common/              # Reusable UI primitives (Button, Card, Badge, Avatar, Input, StatCard)
│   └── layout/              # Shell chrome (AppLayout, Navbar, Sidebar)
├── data/
│   └── mockData.ts          # Realistic seed data (Users, Projects, 3-column Tasks, Notifications)
├── pages/                   # Application route views (Landing, Dashboard, Projects, Workspace, Team, Notifications, Settings)
├── routes/
│   └── AppRoutes.tsx        # Central React Router navigation tree
├── styles/
│   ├── variables.css        # CSS custom properties for white & soft lavender palette
│   ├── layout.css           # App shell, sticky sidebar, topbar, & landing page styles
│   └── components.css       # Rounded cards, pill badges, buttons, and modals
├── types/
│   └── index.ts             # TypeScript interfaces (User, Project, Task, AppNotification, etc.)
├── App.tsx                  # Root component configured with BrowserRouter
├── index.css                # Base stylesheet and font resets
└── main.tsx                 # Vite React application entrypoint
```
