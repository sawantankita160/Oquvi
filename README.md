# Oquvi ⚡ Real-Time Collaborative Workspace

> **Modern Team Sprint & Telemetry Platform** built with **React 19**, **TypeScript**, **Vite**, **Vanilla CSS**, and **Supabase Realtime**.

Oquvi is a production-ready collaborative workspace frontend engineered with a white and soft lavender design aesthetic, electric indigo accents, clean typography, rounded cards, real-time cross-user synchronization, and deterministic Team Insights telemetry.

---

## 🛠️ Tech Stack

- **Core:** React 19, TypeScript, Vite
- **Styling:** Custom Vanilla CSS Design System (clean white, soft lavender mist, electric indigo accents, responsive grid)
- **Backend / Database:** Supabase (PostgreSQL, Supabase Auth, Row Level Security, Realtime Broadcast)
- **Icons:** Lucide React
- **Routing:** React Router v7 with Protected Route guards
- **Testing:** Native Node.js Test Runner (`node --test`)
- **Linting:** Oxlint (zero warnings, zero errors)

---

## 🎨 Design System & Visual Identity

- **Background Palette:** Clean white (`#ffffff`) and soft lavender mist (`#faf8ff`, `#ede9fe`, `#f3f0ff`).
- **Brand Accents:** Electric Indigo (`#4f46e5`, `#4338ca`) and Violet gradients.
- **Card Styling:** Rounded corners (`18px` radius), soft multi-layered shadows, and hairline borders.
- **Typography:** Inter with modern visual hierarchy and high readability contrast.

---

## ⚙️ Required Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# Required Supabase Credentials (Frontend-Safe)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-real-anon-public-key
```

> ⚠️ **Security Notice:**
> - Only frontend-safe variables prefixed with `VITE_` are used.
> - Never commit `.env` to Git. `.gitignore` is pre-configured to ignore `.env`, `.env.production`, and `.env.local`.
> - Never use or expose your Supabase `service_role` secret key in client code.

---

## 🗄️ Supabase Setup & Database Migration

Oquvi uses 7 core PostgreSQL tables with Row Level Security (RLS) and Supabase Realtime synchronization:

### 1. Database Tables
- **`profiles`**: Linked 1:1 with `auth.users(id)`. Managed automatically via a database trigger (`on_auth_user_created`) on signup.
- **`projects`**: Collaborative workspaces with title, description, `owner_id`, deadline, and archived status.
- **`project_members`**: Join table mapping users to projects with roles (`owner`, `member`), protected by a unique constraint `(project_id, user_id)`.
- **`tasks`**: Sprint tasks with assignee, title, description, status (`todo`, `in_progress`, `completed`), priority (`low`, `medium`, `high`, `urgent`), and deadline.
- **`task_comments`**: Discussion threads on tasks authored by project collaborators.
- **`notifications`**: User-specific notification inbox for project/task alerts.
- **`activity_logs`**: Immutable audit trail of actions taken inside projects.

### 2. How to Apply the Database Schema
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. In the left navigation, open the **SQL Editor** (`<_>`).
3. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste it into the query window.
4. Click **Run** to create all tables, indexes, triggers, and RLS policies.
5. *(Optional)* Apply [`supabase/migrations/20261004000001_task_broadcast.sql`](./supabase/migrations/20261004000001_task_broadcast.sql) for database-level broadcast trigger support.

### 3. Authentication Configuration
- In your Supabase Dashboard under **Authentication** -> **Providers** -> **Email**:
  - If you wish to allow instant signups during testing without waiting for confirmation emails, turn **"Confirm email"** OFF.

---

## ⚡ Local Setup & Commands

```powershell
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Run linter (zero warnings, zero errors)
npm run lint

# 4. Verify TypeScript compilation and production bundle
npm run build

# 5. Start Vite development server
npm run dev

# 6. Preview the production build locally
npm run preview
```

Access the local dev server at: `http://localhost:5173/` (or `http://localhost:5174/`).

---

## 🚀 Production Deployment (GitHub + Vercel)

### Step 1: Push Repository to GitHub
Ensure `.env` is not staged (it is already ignored by `.gitignore`):
```bash
git add .
git commit -m "Prepare Oquvi for production deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Log in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
2. Select your GitHub repository (`oquvi`).
3. Vercel automatically detects the Vite framework preset:
   - **Build Command:** `npm run build` (or `tsc -b && vite build`)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-real-anon-public-key`
5. Click **Deploy**.

### Step 3: SPA Routing Support
The repository includes a root [`vercel.json`](./vercel.json) rewrite rule to support React Router single-page navigation:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This guarantees that direct links (e.g. `/workspace?view=insights`, `/dashboard`, `/projects`) and browser refreshes work seamlessly in production.

---

## 👥 Hackathon 2-User Live Demo Script

Use this step-by-step walkthrough to demonstrate real-time multi-user collaboration and Team Insights telemetry:

### Setup (Before Demo)
- Open **Browser 1** (e.g., Google Chrome) logged in as **User A**.
- Open **Browser 2** (e.g., Microsoft Edge or Incognito) logged in as **User B**.
- Ensure both accounts are members of the same project (e.g., "Hackathon Workspace" on `/projects`).
- On both browsers, navigate to `/workspace`.

### Demonstration Steps

1. **Live Task Creation (User A → User B):**
   - In Browser 1, **User A** clicks **"+ Add Task"**.
   - Fill in:
     - Title: `Deploy Production Edge Workers`
     - Column: `To Do`
     - Priority: `High`
     - Assignee: `User B`
     - Due date: `Tomorrow`
   - Click **"Create Task"**.
   - **Observe:** In Browser 2, the new task immediately appears on **User B's** Kanban board in real time without refreshing.

2. **Live Kanban Status Transition:**
   - In Browser 2, **User B** moves the task from **To Do** to **In Progress** (click "In Progress →").
   - **Observe:** In Browser 1, **User A's** board updates instantly to show the task in the **In Progress** column.

3. **Real-Time Task Comments & Activity History:**
   - In Browser 1, **User A** clicks the task card to open the Details & Comments modal.
   - Type `"Approved, let's ship this!"` and click **"Post Comment"**.
   - **Observe:** In Browser 2, opening the task modal shows the new comment immediately.
   - Click the **"Activity Feed"** button in the workspace header to see the timestamped audit log of all transitions.

4. **In-App Realtime Notifications:**
   - Because User A assigned User B, observe the bell icon in **User B's** top navigation bar.
   - The unread badge updates live. Clicking the notification opens the relevant task.

5. **Team Insights & Telemetry:**
   - In either browser, toggle the header segmented switcher from **"Kanban"** to **"Team Insights"** (or click the **Quick Health Badge** in the header).
   - Showcase the 4 telemetry pillars:
     1. **Project Health Score & KPI Cards:** Live calculation of completion progress (`completed / total × 100`), overdue count, and upcoming 72-hour deadlines.
     2. **Active Tasks by Member (Lightweight Chart):** Real-time horizontal workload distribution comparing active vs. completed tasks per member.
     3. **Rule-Based Recommendations ("Why this project needs attention"):** Transparent, deterministic rules (zero AI/LLM hallucination) flagging approaching deadlines or workload imbalances.
     4. **Blocked Tasks Status:** Graceful fallback confirming independent deliverable execution.
