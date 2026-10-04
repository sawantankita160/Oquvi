-- ==============================================================================
-- Oquvi - Collaborative Project Workspace
-- Supabase PostgreSQL Task Realtime Broadcast Migration
-- ==============================================================================
-- Migration: 20261004000001_task_broadcast.sql
-- Description: Replaces postgres_changes for task synchronization with Supabase
--              "Broadcast from Database".
--              1. Emits real-time Broadcast messages on task INSERT, UPDATE, DELETE
--                 to topic 'oquvi:project:<project_id>:tasks' using realtime.broadcast_changes().
--              2. Grants authenticated project members permission to receive task
--                 broadcasts for their projects via Row Level Security on realtime.messages.
-- ==============================================================================

-- 1. Trigger function to broadcast task changes from PostgreSQL
CREATE OR REPLACE FUNCTION public.broadcast_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project_id uuid;
  v_topic text;
BEGIN
  -- Extract project_id based on operation (NEW for INSERT/UPDATE, OLD for DELETE)
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  -- Form stable project task broadcast topic
  v_topic := 'oquvi:project:' || v_project_id::text || ':tasks';

  -- Broadcast change via Supabase Realtime engine
  PERFORM realtime.broadcast_changes(
    v_topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  RETURN NULL;
END;
$$;

-- 2. Bind AFTER trigger to public.tasks (rerunnable)
DROP TRIGGER IF EXISTS tr_broadcast_task_changes ON public.tasks;

CREATE TRIGGER tr_broadcast_task_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_task_changes();

-- 3. Row Level Security Policy on realtime.messages
-- Allows authenticated users to receive private broadcast events only for projects where they are members
DROP POLICY IF EXISTS "Authenticated users can receive task broadcasts for their projects" ON "realtime"."messages";

CREATE POLICY "Authenticated users can receive task broadcasts for their projects"
ON "realtime"."messages"
FOR SELECT
TO authenticated
USING (
  realtime.messages.extension = 'broadcast'
  AND (SELECT realtime.topic()) LIKE 'oquvi:project:%:tasks'
  AND EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.user_id = (SELECT auth.uid())
      AND pm.project_id = (
        CASE
          WHEN (SELECT realtime.topic()) LIKE 'oquvi:project:%:tasks'
          THEN split_part((SELECT realtime.topic()), ':', 3)::uuid
          ELSE NULL
        END
      )
  )
);
