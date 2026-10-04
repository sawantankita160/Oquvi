import { supabase } from './supabase';
import type { Database, TaskStatus, PriorityLevel } from '../types/database';
import { logActivity } from './projectService';

export type DbTask = Database['public']['Tables']['tasks']['Row'];

export interface TaskWithAssignee {
  id: string;
  project_id: string;
  assigned_user_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: PriorityLevel;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  assignee: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Fetch all tasks for a specific project.
 * Protected by RLS: user must be project owner or member.
 */
export async function fetchTasks(projectId: string): Promise<{ data: TaskWithAssignee[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        project_id,
        assigned_user_id,
        title,
        description,
        status,
        priority,
        deadline,
        created_at,
        updated_at,
        profiles:assigned_user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) return { data: [], error: null };

    const tasks: TaskWithAssignee[] = data.map((t) => {
      const prof = t.profiles as unknown as { id: string; full_name: string; avatar_url: string | null } | null;
      return {
        id: t.id,
        project_id: t.project_id,
        assigned_user_id: t.assigned_user_id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        deadline: t.deadline,
        created_at: t.created_at,
        updated_at: t.updated_at,
        assignee: prof || null
      };
    });

    return { data: tasks, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch tasks.' };
  }
}

/**
 * Create a new task in a project.
 */
export async function createTask(params: {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: PriorityLevel;
  assignedUserId?: string | null;
  deadline?: string | null;
  currentUserId?: string;
}): Promise<{ data: DbTask | null; error: string | null }> {
  try {
    const trimmedTitle = params.title.trim();
    if (!trimmedTitle) {
      return { data: null, error: 'Task title is required.' };
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: params.projectId,
        title: trimmedTitle,
        description: params.description?.trim() || null,
        status: params.status || 'todo',
        priority: params.priority || 'medium',
        assigned_user_id: params.assignedUserId || null,
        deadline: params.deadline || null
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (params.currentUserId) {
      await logActivity({
        projectId: params.projectId,
        userId: params.currentUserId,
        action: `Added task "${trimmedTitle}"`
      });
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create task.' };
  }
}

/**
 * Move or change the status of a task ('todo' | 'in_progress' | 'completed').
 */
export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  newStatus: TaskStatus,
  currentUserId?: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      return { error: error.message };
    }

    if (currentUserId) {
      const statusLabel = newStatus === 'in_progress' ? 'In Progress' : newStatus === 'completed' ? 'Completed' : 'To Do';
      await logActivity({
        projectId,
        userId: currentUserId,
        action: `Moved task to ${statusLabel}`
      });
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update task status.' };
  }
}

/**
 * Delete a task.
 */
export async function deleteTask(taskId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete task.' };
  }
}
