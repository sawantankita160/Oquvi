import { supabase } from './supabase';
import type { Database } from '../types/database';
import { logActivity } from './projectService';
import { dispatchNotification } from './notificationService';

export type DbTaskComment = Database['public']['Tables']['task_comments']['Row'];

export interface TaskCommentWithAuthor {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Fetch all comments for a specific task.
 * Protected by RLS: user must be able to access the task's project.
 */
export async function fetchTaskComments(taskId: string): Promise<{
  data: TaskCommentWithAuthor[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        id,
        task_id,
        user_id,
        comment,
        created_at,
        updated_at,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) return { data: [], error: null };

    const formatted: TaskCommentWithAuthor[] = data.map((c) => {
      const prof = c.profiles as unknown as { id: string; full_name: string; avatar_url: string | null } | null;
      return {
        id: c.id,
        task_id: c.task_id,
        user_id: c.user_id,
        comment: c.comment,
        created_at: c.created_at,
        updated_at: c.updated_at,
        author: prof || null
      };
    });

    return { data: formatted, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch task comments.' };
  }
}

/**
 * Add a new comment to a task.
 */
export async function createTaskComment(params: {
  taskId: string;
  projectId: string;
  comment: string;
  currentUserId: string;
  taskTitle?: string;
  assignedUserId?: string | null;
}): Promise<{ data: DbTaskComment | null; error: string | null }> {
  try {
    const trimmed = params.comment.trim();
    if (!trimmed) {
      return { data: null, error: 'Comment text cannot be empty.' };
    }

    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: params.taskId,
        user_id: params.currentUserId,
        comment: trimmed
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // 1. Audit trail: Record in activity_logs
    const taskName = params.taskTitle || 'task';
    await logActivity({
      projectId: params.projectId,
      userId: params.currentUserId,
      action: `Commented on task "${taskName}"`
    });

    // 2. Notification: Inform the assigned collaborator if they are not the author
    if (params.assignedUserId && params.assignedUserId !== params.currentUserId) {
      await dispatchNotification({
        userId: params.assignedUserId,
        projectId: params.projectId,
        taskId: params.taskId,
        message: `New comment on your task "${taskName}"`,
        actorId: params.currentUserId
      });
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to post comment.' };
  }
}

/**
 * Update an existing comment.
 * Protected by RLS: user must be the author (user_id = auth.uid()).
 */
export async function updateTaskComment(params: {
  commentId: string;
  comment: string;
  currentUserId: string;
  projectId?: string;
  taskTitle?: string;
}): Promise<{ data: DbTaskComment | null; error: string | null }> {
  try {
    const trimmed = params.comment.trim();
    if (!trimmed) {
      return { data: null, error: 'Comment text cannot be empty.' };
    }

    const { data, error } = await supabase
      .from('task_comments')
      .update({ comment: trimmed })
      .eq('id', params.commentId)
      .eq('user_id', params.currentUserId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (params.projectId) {
      const taskName = params.taskTitle || 'task';
      await logActivity({
        projectId: params.projectId,
        userId: params.currentUserId,
        action: `Edited comment on task "${taskName}"`
      });
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update comment.' };
  }
}

/**
 * Delete a comment.
 * Protected by RLS: author or project owner.
 */
export async function deleteTaskComment(params: {
  commentId: string;
  currentUserId?: string;
  projectId?: string;
  taskTitle?: string;
}): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', params.commentId);

    if (error) {
      return { error: error.message };
    }

    if (params.projectId && params.currentUserId) {
      const taskName = params.taskTitle || 'task';
      await logActivity({
        projectId: params.projectId,
        userId: params.currentUserId,
        action: `Deleted comment on task "${taskName}"`
      });
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete comment.' };
  }
}
