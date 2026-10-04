import { supabase } from './supabase';
import type { Database } from '../types/database';

export type DbNotification = Database['public']['Tables']['notifications']['Row'];

export interface NotificationWithContext {
  id: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
  project?: {
    id: string;
    name: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
}

/**
 * Fetch notifications for the current authenticated user.
 * Protected by RLS: user can only see rows where user_id = auth.uid().
 */
export async function fetchNotifications(limit = 40): Promise<{
  data: NotificationWithContext[] | null;
  error: string | null;
}> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        project_id,
        task_id,
        message,
        read,
        created_at,
        projects:project_id (
          id,
          name
        ),
        tasks:task_id (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) return { data: [], error: null };

    const formatted: NotificationWithContext[] = data.map((n) => {
      const proj = n.projects as unknown as { id: string; name: string } | null;
      const t = n.tasks as unknown as { id: string; title: string } | null;
      return {
        id: n.id,
        user_id: n.user_id,
        project_id: n.project_id,
        task_id: n.task_id,
        message: n.message,
        read: n.read,
        created_at: n.created_at,
        project: proj || null,
        task: t || null
      };
    });

    return { data: formatted, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch notifications.' };
  }
}

/**
 * Get count of unread notifications for current user.
 */
export async function fetchUnreadNotificationCount(): Promise<{ count: number; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      return { count: 0, error: null };
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    return { count: 0, error: err instanceof Error ? err.message : 'Failed to fetch notification count.' };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to mark notification as read.' };
  }
}

/**
 * Mark all notifications as read for current user.
 */
export async function markAllNotificationsAsRead(): Promise<{ error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', sessionData.session.user.id)
      .eq('read', false);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to mark all as read.' };
  }
}

/**
 * Delete / dismiss a notification.
 */
export async function deleteNotification(notificationId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete notification.' };
  }
}

/**
 * Dispatch an in-app notification to a user.
 * Rule: Never notify the actor about their own action.
 */
export async function dispatchNotification(params: {
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  message: string;
  actorId?: string | null;
}): Promise<void> {
  try {
    // 1. Never notify actor about their own action
    if (params.actorId && params.actorId === params.userId) {
      return;
    }

    // 2. Insert notification
    await supabase.from('notifications').insert({
      user_id: params.userId,
      project_id: params.projectId || null,
      task_id: params.taskId || null,
      message: params.message.trim(),
      read: false
    });
  } catch {
    // Notification delivery failure should not break primary transactions
  }
}
