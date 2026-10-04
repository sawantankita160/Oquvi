import { supabase } from './supabase';
import type { Database, TaskStatus, PriorityLevel } from '../types/database';
import { logActivity } from './projectService';
import { dispatchNotification } from './notificationService';

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
  commentsCount?: number;
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
        ),
        task_comments (
          id
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
      const comments = (t.task_comments as unknown as Array<{ id: string }>) || [];
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
        assignee: prof || null,
        commentsCount: comments.length
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
  projectName?: string;
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

    // 1. Audit log
    if (params.currentUserId) {
      await logActivity({
        projectId: params.projectId,
        userId: params.currentUserId,
        action: `Created task "${trimmedTitle}"`
      });
    }

    // 2. Notification to assignee (if assigned to someone else)
    if (params.assignedUserId && params.currentUserId && params.assignedUserId !== params.currentUserId) {
      await dispatchNotification({
        userId: params.assignedUserId,
        projectId: params.projectId,
        taskId: data.id,
        message: `You were assigned to task "${trimmedTitle}"`,
        actorId: params.currentUserId
      });
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create task.' };
  }
}

/**
 * Update an existing task's title, description, status, priority, assignee, or deadline.
 */
export async function updateTask(
  taskId: string,
  projectId: string,
  params: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: PriorityLevel;
    assignedUserId?: string | null;
    deadline?: string | null;
    previousAssignedUserId?: string | null;
  },
  currentUserId?: string
): Promise<{ data: DbTask | null; error: string | null }> {
  try {
    const updates: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: PriorityLevel;
      assigned_user_id?: string | null;
      deadline?: string | null;
    } = {};

    if (params.title !== undefined) {
      const trimmed = params.title.trim();
      if (!trimmed) {
        return { data: null, error: 'Task title cannot be empty.' };
      }
      updates.title = trimmed;
    }

    if (params.description !== undefined) {
      updates.description = params.description?.trim() || null;
    }

    if (params.status !== undefined) {
      updates.status = params.status;
    }

    if (params.priority !== undefined) {
      updates.priority = params.priority;
    }

    if (params.assignedUserId !== undefined) {
      updates.assigned_user_id = params.assignedUserId || null;
    }

    if (params.deadline !== undefined) {
      updates.deadline = params.deadline || null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const taskLabel = updates.title || data.title;

    // 1. Audit log
    if (currentUserId) {
      await logActivity({
        projectId,
        userId: currentUserId,
        action: `Updated task "${taskLabel}"`
      });
    }

    // 2. Notification if assigned to new user
    if (
      updates.assigned_user_id &&
      updates.assigned_user_id !== params.previousAssignedUserId &&
      currentUserId &&
      updates.assigned_user_id !== currentUserId
    ) {
      await dispatchNotification({
        userId: updates.assigned_user_id,
        projectId,
        taskId: taskId,
        message: `You were assigned to task "${taskLabel}"`,
        actorId: currentUserId
      });
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update task.' };
  }
}

/**
 * Move or change the status of a task ('todo' | 'in_progress' | 'completed').
 */
export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  newStatus: TaskStatus,
  currentUserId?: string,
  taskTitle?: string,
  assignedUserId?: string | null
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, project_id: projectId })
      .eq('id', taskId);

    if (error) {
      return { error: error.message };
    }

    const statusLabel =
      newStatus === 'in_progress' ? 'In Progress' : newStatus === 'completed' ? 'Completed' : 'To Do';
    const taskName = taskTitle || 'task';

    // 1. Audit log
    if (currentUserId) {
      await logActivity({
        projectId,
        userId: currentUserId,
        action: `Moved task "${taskName}" to ${statusLabel}`
      });
    }

    // 2. Notification if someone else is assigned to this task
    if (assignedUserId && currentUserId && assignedUserId !== currentUserId) {
      await dispatchNotification({
        userId: assignedUserId,
        projectId,
        taskId: taskId,
        message: `Task "${taskName}" was moved to ${statusLabel}`,
        actorId: currentUserId
      });
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update task status.' };
  }
}

/**
 * Delete a task.
 * Protected by RLS: only project owner or task assignee can delete.
 */
export async function deleteTask(
  taskId: string,
  metadata?: {
    projectId?: string;
    taskTitle?: string;
    currentUserId?: string;
  }
): Promise<{ error: string | null }> {
  try {
    // 1. Audit log before deletion
    if (metadata?.projectId && metadata?.currentUserId) {
      const taskName = metadata.taskTitle || 'task';
      await logActivity({
        projectId: metadata.projectId,
        userId: metadata.currentUserId,
        action: `Deleted task "${taskName}"`
      });
    }

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
