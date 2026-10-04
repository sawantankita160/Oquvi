import { supabase } from './supabase';

/**
 * Debounce helper to prevent rapid-fire cascading refetches
 * when multiple realtime events arrive in bursts.
 */
function debounce<A extends unknown[]>(fn: (...args: A) => void, delay = 250): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/**
 * Subscribe to realtime updates for a specific project's workspace:
 * - Tasks created, updated, moved, or deleted
 * - Activity logs recorded
 * - Task comments added/changed
 *
 * Calls `onUpdate` safely to trigger clean data reconciliation without duplication.
 * Returns an unsubscribe callback for cleanup on component unmount or project switch.
 */
export function subscribeToProjectWorkspace(
  projectId: string,
  callbacks: {
    onTasksChange?: (reason?: string) => void;
    onActivityChange?: () => void;
    onCommentsChange?: () => void;
  }
): () => void {
  if (!projectId) {
    return () => {};
  }

  const debouncedTasks = callbacks.onTasksChange ? debounce(callbacks.onTasksChange, 250) : null;
  const debouncedActivity = callbacks.onActivityChange ? debounce(callbacks.onActivityChange, 250) : null;
  const debouncedComments = callbacks.onCommentsChange ? debounce(callbacks.onCommentsChange, 250) : null;

  const topic = `oquvi:project:${projectId}:tasks`;
  console.log(`[Oquvi Broadcast] Initializing task broadcast channel "${topic}" for project: ${projectId}`);

  // Create private Broadcast channel for this project's tasks
  const channel = supabase.channel(topic, {
    config: {
      private: true
    }
  });

  // 1. Listen for task changes streamed via Supabase Database Broadcast (INSERT, UPDATE, DELETE)
  if (debouncedTasks) {
    channel
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        console.log('[Oquvi Broadcast] TASK INSERT RECEIVED', payload);
        console.log('[Oquvi Broadcast] reloading tasks after INSERT');
        debouncedTasks('INSERT');
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        console.log('[Oquvi Broadcast] TASK UPDATE RECEIVED', payload);
        console.log('[Oquvi Broadcast] reloading tasks after UPDATE');
        debouncedTasks('UPDATE');
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        console.log('[Oquvi Broadcast] TASK DELETE RECEIVED', payload);
        console.log('[Oquvi Broadcast] reloading tasks after DELETE');
        debouncedTasks('DELETE');
      });
  }

  // 2. Listen for activity log additions scoped to this project
  if (debouncedActivity) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs',
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        console.log('[Oquvi Realtime] ACTIVITY LOG INSERT RECEIVED:', {
          eventType: payload.eventType,
          new: payload.new
        });
        debouncedActivity();
      }
    );
  }

  // 3. Listen for task comment events
  if (debouncedComments) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_comments'
      },
      (payload) => {
        console.log('[Oquvi Realtime] TASK COMMENT EVENT RECEIVED:', {
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old
        });
        debouncedComments();
      }
    );
  }

  // Authenticate Realtime client with the active session before subscribing to private channel
  let isCancelled = false;

  const initChannel = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      } else {
        await supabase.realtime.setAuth();
      }
    } catch (authErr) {
      console.warn('[Oquvi Broadcast] Error setting realtime auth:', authErr);
    }

    if (isCancelled) {
      supabase.removeChannel(channel);
      return;
    }

    channel.subscribe((status, err) => {
      console.log(`[Oquvi Broadcast] Subscription status for channel "${topic}":`, status);
      if (status === 'SUBSCRIBED') {
        console.log('[Oquvi Broadcast] task channel SUBSCRIBED');
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Oquvi Broadcast] CHANNEL_ERROR on channel "${topic}":`, err);
      } else if (status === 'TIMED_OUT') {
        console.warn(`[Oquvi Broadcast] TIMED_OUT on channel "${topic}":`, err);
      } else if (status === 'CLOSED') {
        console.warn(`[Oquvi Broadcast] CLOSED on channel "${topic}":`, err);
      }
    });
  };

  initChannel();

  // Return unsubscribe handler to ensure clean teardown
  return () => {
    isCancelled = true;
    console.log(`[Oquvi Broadcast] Unsubscribing channel "${topic}"`);
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to realtime comments for a specific task.
 * Cleans up when the task modal or drawer is closed.
 */
export function subscribeToTaskComments(
  taskId: string,
  onCommentChange: () => void
): () => void {
  if (!taskId) {
    return () => {};
  }

  const debounced = debounce(onCommentChange, 250);
  const channelName = `task-comments-${taskId}-${Date.now()}`;
  const channel = supabase.channel(channelName);

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_comments',
        filter: `task_id=eq.${taskId}`
      },
      () => {
        debounced();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to realtime notifications for the current authenticated user.
 * Filtered strictly to `user_id=eq.${userId}` so no other user's notifications are received.
 */
export function subscribeToUserNotifications(
  userId: string,
  onNotification: () => void
): () => void {
  if (!userId) {
    return () => {};
  }

  const debounced = debounce(onNotification, 200);
  const channelName = `user-notifications-${userId}-${Date.now()}`;
  const channel = supabase.channel(channelName);

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      () => {
        debounced();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
