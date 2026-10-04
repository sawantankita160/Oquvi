import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Home,
  LogOut,
  Settings,
  User as UserIcon,
  ChevronDown,
  CheckCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationWithContext
} from '../../lib/notificationService';
import { subscribeToUserNotifications } from '../../lib/realtimeService';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNewProjectClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onNewProjectClick
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithContext[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Initial fetch and Realtime subscription for incoming notifications
  useEffect(() => {
    if (!user) return;

    const refresh = () => {
      fetchNotifications(6).then((notifRes) => {
        if (notifRes.data) setNotifications(notifRes.data);
      });
      fetchUnreadNotificationCount().then((countRes) => {
        if (countRes.count !== undefined) setUnreadCount(countRes.count);
      });
    };

    refresh();

    // Subscribe to realtime notifications scoped to this user
    const unsubscribe = subscribeToUserNotifications(user.id, refresh);

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  const handleMarkOneRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
  };

  // Compute display name and email from authenticated Supabase user
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Team Member';
  const displayEmail = user?.email || 'user@oquvi.dev';

  const handleLogout = async () => {
    setProfileOpen(false);
    setNotifOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Open navigation sidebar"
        >
          <Menu size={22} />
        </button>

        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <div className="input-container">
            <span className="input-icon-left">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search projects, tasks, or members..."
              className="input-field has-icon-left"
              style={{ fontSize: '0.825rem', padding: '8px 12px 8px 36px' }}
            />
          </div>
        </div>
      </div>

      <div className="navbar-right">
        <Link
          to="/"
          className="icon-btn"
          title="Return to Landing Page"
          aria-label="Landing Page"
        >
          <Home size={18} />
        </Link>

        {/* In-App Notifications Bell with Live Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="icon-btn"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            style={{
              position: 'relative',
              background: notifOpen ? 'var(--bg-lavender-subtle)' : 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  borderRadius: '999px',
                  background: 'var(--rose-500)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="notification-indicator" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '340px',
                maxWidth: '90vw',
                background: '#ffffff',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-hover)',
                zIndex: 60,
                animation: 'scaleUp 150ms ease-out',
                overflow: 'hidden'
              }}
            >
              {/* Dropdown Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'var(--bg-lavender-subtle)',
                        color: 'var(--primary)',
                        padding: '2px 6px',
                        borderRadius: '999px'
                      }}
                    >
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification items list */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Sparkles size={24} color="var(--primary)" style={{ opacity: 0.6, marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={(e) => {
                        if (!notif.read) {
                          handleMarkOneRead(notif.id, e);
                        }
                        if (notif.project_id) {
                          navigate(`/workspace?projectId=${notif.project_id}`);
                          setNotifOpen(false);
                        }
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: notif.read ? '#ffffff' : '#fcfaff',
                        borderLeft: notif.read ? 'none' : '3px solid var(--primary)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = notif.read ? '#ffffff' : '#fcfaff')
                      }
                    >
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                        {notif.message}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px',
                          fontSize: '0.72rem',
                          color: 'var(--text-dim)'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          {new Date(notif.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>

                        {notif.project && (
                          <span
                            style={{
                              background: 'rgba(99, 102, 241, 0.08)',
                              color: 'var(--primary)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '0.68rem'
                            }}
                          >
                            {notif.project.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              <div
                style={{
                  padding: '10px 16px',
                  background: 'var(--bg-surface)',
                  borderTop: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}
              >
                <Link
                  to="/notifications"
                  onClick={() => setNotifOpen(false)}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  View all in Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={15} />}
          onClick={onNewProjectClick || (() => navigate('/projects'))}
        >
          New Item
        </Button>

        {/* User Profile Menu with Dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px',
              borderRadius: 'var(--radius-full)'
            }}
            aria-label="Open user profile menu"
            aria-expanded={profileOpen}
          >
            <Avatar
              name={displayName}
              size="md"
              status="online"
              showStatus
            />
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                background: '#ffffff',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-hover)',
                padding: '8px',
                zIndex: 50,
                animation: 'scaleUp 150ms ease-out'
              }}
            >
              {/* User Identity Info */}
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '6px'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '2px'
                  }}
                >
                  {displayEmail}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    background: 'var(--bg-lavender-subtle)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    marginTop: '6px'
                  }}
                >
                  {user ? 'Authenticated via Supabase' : 'Demo Session'}
                </span>
              </div>

              {/* Menu Links */}
              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Settings size={16} color="var(--primary)" />
                <span>Workspace Settings</span>
              </Link>

              <Link
                to="/team"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <UserIcon size={16} color="var(--primary)" />
                <span>Team Directory</span>
              </Link>

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />

              {/* Sign out button */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--rose-500)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#ffe4e6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
