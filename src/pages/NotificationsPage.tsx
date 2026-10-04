import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckSquare,
  Sparkles,
  Clock,
  Trash2,
  FolderKanban,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type NotificationWithContext
} from '../lib/notificationService';
import { subscribeToUserNotifications } from '../lib/realtimeService';
import { Card, Button, Badge } from '../components/common';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationWithContext[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await fetchNotifications(50);
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      setNotifications(data || []);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (!user) return;

    fetchNotifications(50).then(({ data, error }) => {
      if (!isMounted) return;
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        setNotifications(data || []);
      }
    });

    const unsubscribe = subscribeToUserNotifications(user.id, () => {
      if (!isMounted) return;
      loadNotifications();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const { error } = await markAllNotificationsAsRead();
    if (error) {
      setErrorMsg(`Failed to mark all as read: ${error}`);
      loadNotifications();
    } else {
      setSuccessMsg('All notifications marked as read.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    // Optimistic toggle
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !currentRead } : n))
    );
    if (!currentRead) {
      await markNotificationAsRead(id);
    }
  };

  const handleDismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const { error } = await deleteNotification(id);
    if (error) {
      setErrorMsg(`Failed to dismiss notification: ${error}`);
      loadNotifications();
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">
            Stay on top of task assignments, sprint activity, and team comments in real time.
          </p>
        </div>

        <div className="page-actions">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCheck size={16} />}
              onClick={handleMarkAllRead}
            >
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: '#dcfce7',
            border: '1px solid rgba(22, 163, 74, 0.25)',
            color: '#15803d',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: '#ffe4e6',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            color: '#be123c',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            size="sm"
            variant={activeFilter === 'all' ? 'primary' : 'outline'}
            onClick={() => setActiveFilter('all')}
          >
            All Updates ({notifications.length})
          </Button>

          <Button
            size="sm"
            variant={activeFilter === 'unread' ? 'primary' : 'outline'}
            onClick={() => setActiveFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredNotifications.length}</strong> alerts
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading your notifications...
        </div>
      )}

      {/* Notifications List */}
      {!loading && filteredNotifications.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '54px 24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'var(--bg-lavender-subtle)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <Bell size={26} />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', color: 'var(--text-main)' }}>
            No notifications here
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            You're completely caught up with all sprint task assignments and comments.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              style={{
                padding: '18px 22px',
                borderLeft: notif.read
                  ? '1px solid var(--border-card)'
                  : '4px solid var(--primary)',
                background: notif.read ? '#ffffff' : '#fcfaff',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'var(--bg-lavender-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {notif.task_id ? (
                      <CheckSquare size={18} color="var(--primary)" />
                    ) : (
                      <Sparkles size={18} color="#7c3aed" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                        flexWrap: 'wrap'
                      }}
                    >
                      {notif.project && (
                        <Badge variant="in_progress">
                          {notif.project.name}
                        </Badge>
                      )}

                      {notif.task && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            background: '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          Task: {notif.task.title}
                        </span>
                      )}

                      {!notif.read && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--primary)'
                          }}
                        />
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-main)',
                        fontWeight: notif.read ? 400 : 600,
                        margin: '0 0 8px 0',
                        lineHeight: 1.5
                      }}
                    >
                      {notif.message}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(notif.created_at).toLocaleString()}
                      </span>

                      {notif.project_id && (
                        <button
                          onClick={() => navigate(`/workspace?projectId=${notif.project_id}`)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            padding: 0,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FolderKanban size={12} />
                          Go to Workspace
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Toggle read & dismiss */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRead(notif.id, notif.read)}
                    title={notif.read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {notif.read ? 'Unread' : 'Mark Read'}
                  </Button>

                  <button
                    onClick={() => handleDismiss(notif.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px'
                    }}
                    title="Dismiss notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
