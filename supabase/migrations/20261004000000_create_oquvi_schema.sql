-- ==============================================================================
-- Oquvi - Collaborative Project Workspace
-- Supabase PostgreSQL Database Schema & Security Migration
-- ==============================================================================
-- Migration: 20261004000000_create_oquvi_schema.sql
-- Description: Sets up the core relational schema for Oquvi including profiles,
--              projects, members, tasks, comments, notifications, and activity logs.
--              Includes Row Level Security (RLS) policies, indexes, and triggers.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Utility Functions (Updated_at & Security Definer Helpers)
-- ==============================================================================

-- Trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;

-- ==============================================================================
-- 3. Table Definitions
-- ==============================================================================

-- 3.1 PROFILES (Synchronized with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  description TEXT DEFAULT '',
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deadline TIMESTAMPTZ,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 PROJECT MEMBERS (Many-to-Many relationship with roles)
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

-- 3.4 TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5 TASK COMMENTS
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL CHECK (char_length(trim(comment)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(trim(message)) > 0),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.7 ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (char_length(trim(action)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. Performance Indexes
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON public.projects(archived);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user_id ON public.tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.task_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ==============================================================================
-- 5. Timestamp Update Triggers
-- ==============================================================================

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_tasks_updated_at ON public.tasks;
CREATE TRIGGER tr_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER tr_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 6. Automated Lifecycle Triggers
-- ==============================================================================

-- 6.1 Automatically create or update a profile on auth.users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.2 Automatically add the project creator to project_members with role 'owner'
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (new.id, new.owner_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();

-- ==============================================================================
-- 7. Security Definer Authorization Helper Functions
-- (Prevents infinite recursion in RLS policies)
-- ==============================================================================

-- Check if user is the owner of a project
CREATE OR REPLACE FUNCTION public.is_project_owner(p_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_id AND owner_id = u_id
  );
$$;

-- Check if user is an approved member of a project
CREATE OR REPLACE FUNCTION public.is_project_member(p_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id AND user_id = u_id
  );
$$;

-- Check if user has access to a project (owner or member)
CREATE OR REPLACE FUNCTION public.can_access_project(p_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_project_owner(p_id, u_id) OR public.is_project_member(p_id, u_id);
$$;

-- Check if user has access to the project containing a task
CREATE OR REPLACE FUNCTION public.can_access_task(t_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = t_id
    AND public.can_access_project(t.project_id, u_id)
  );
$$;

-- ==============================================================================
-- 8. Row Level Security (RLS) Configuration & Policies
-- ==============================================================================

-- Enable RLS on all 7 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 8.1 PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 8.2 PROJECTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members and owners can view projects" ON public.projects;
CREATE POLICY "Members and owners can view projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR public.is_project_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
CREATE POLICY "Authenticated users can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Project owners can update their projects" ON public.projects;
CREATE POLICY "Project owners can update their projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Project owners can delete their projects" ON public.projects;
CREATE POLICY "Project owners can delete their projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8.3 PROJECT MEMBERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members and owners can view project members" ON public.project_members;
CREATE POLICY "Members and owners can view project members"
  ON public.project_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.can_access_project(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "Project owners can add project members" ON public.project_members;
CREATE POLICY "Project owners can add project members"
  ON public.project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_project_owner(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "Project owners can update member roles" ON public.project_members;
CREATE POLICY "Project owners can update member roles"
  ON public.project_members
  FOR UPDATE
  TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()))
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can remove members or members can leave" ON public.project_members;
CREATE POLICY "Owners can remove members or members can leave"
  ON public.project_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_project_owner(project_id, auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 8.4 TASKS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project members and owners can view tasks" ON public.tasks;
CREATE POLICY "Project members and owners can view tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project members and owners can create tasks" ON public.tasks;
CREATE POLICY "Project members and owners can create tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_project(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project members and owners can update tasks" ON public.tasks;
CREATE POLICY "Project members and owners can update tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (public.can_access_project(project_id, auth.uid()))
  WITH CHECK (public.can_access_project(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project owners or assignees can delete tasks" ON public.tasks;
CREATE POLICY "Project owners or assignees can delete tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    public.is_project_owner(project_id, auth.uid()) OR assigned_user_id = auth.uid()
  );

-- ------------------------------------------------------------------------------
-- 8.5 TASK COMMENTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Task members can view comments" ON public.task_comments;
CREATE POLICY "Task members can view comments"
  ON public.task_comments
  FOR SELECT
  TO authenticated
  USING (public.can_access_task(task_id, auth.uid()));

DROP POLICY IF EXISTS "Task members can insert comments" ON public.task_comments;
CREATE POLICY "Task members can insert comments"
  ON public.task_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.can_access_task(task_id, auth.uid())
  );

DROP POLICY IF EXISTS "Authors can update own comments" ON public.task_comments;
CREATE POLICY "Authors can update own comments"
  ON public.task_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authors or project owners can delete comments" ON public.task_comments;
CREATE POLICY "Authors or project owners can delete comments"
  ON public.task_comments
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id
      AND public.is_project_owner(t.project_id, auth.uid())
    )
  );

-- ------------------------------------------------------------------------------
-- 8.6 NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authorized users can create notifications" ON public.notifications;
CREATE POLICY "Authorized users can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IS NULL OR public.can_access_project(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8.7 ACTIVITY LOGS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project members can view activity logs" ON public.activity_logs;
CREATE POLICY "Project members can view activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project members can record activity logs" ON public.activity_logs;
CREATE POLICY "Project members can record activity logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid() OR user_id IS NULL)
    AND public.can_access_project(project_id, auth.uid())
  );

-- Note: No UPDATE policy on activity_logs to ensure an immutable, tamper-resistant audit trail.

DROP POLICY IF EXISTS "Project owners can prune activity logs" ON public.activity_logs;
CREATE POLICY "Project owners can prune activity logs"
  ON public.activity_logs
  FOR DELETE
  TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()));
