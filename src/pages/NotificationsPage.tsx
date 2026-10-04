import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  CheckSquare,
  Sparkles,
  Info,
  Clock,
  Trash2
} from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
import type { AppNotification, NotificationType } from '../types';
import { Card, Button, Badge } from '../components/common';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationType>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'mention':
        return <MessageSquare size={18} color="#4f46e5" />;
      case 'assignment':
        return <CheckSquare size={18} color="#0284c7" />;
      case 'project':
        return <Sparkles size={18} color="#7c3aed" />;
      case 'system':
        return <Info size={18} color="#d97706" />;
      default:
        return <Bell size={18} color="#4f46e5" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">
            Stay on top of mentions, assignment updates, and sprint alerts.
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
          {(['all', 'unread', 'mention', 'assignment', 'project', 'system'] as const).map(
            (filter) => (
              <Button
                key={filter}
                size="sm"
                variant={activeFilter === filter ? 'primary' : 'outline'}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'all'
                  ? 'All'
                  : filter === 'unread'
                  ? `Unread (${unreadCount})`
                  : filter.charAt(0).toUpperCase() + filter.slice(1) + 's'}
              </Button>
            )
          )}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredNotifications.length}</strong> updates
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
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
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No notifications here</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            You're completely caught up with all sprint activity.
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
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: notif.read ? 600 : 700,
                          margin: 0,
                          color: 'var(--text-main)'
                        }}
                      >
                        {notif.title}
                      </h4>
                      <Badge variant={notif.type === 'mention' ? 'active' : notif.type === 'assignment' ? 'in_progress' : 'planning'}>
                        {notif.type}
                      </Badge>
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
                        fontSize: '0.875rem',
                        color: 'var(--text-body)',
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
                        {notif.timestamp}
                      </span>
                      {notif.userName && <span>From: <strong>{notif.userName}</strong></span>}
                    </div>
                  </div>
                </div>

                {/* Actions: Toggle read & dismiss */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRead(notif.id)}
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
