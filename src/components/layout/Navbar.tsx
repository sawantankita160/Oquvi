import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Plus, Home, LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { CURRENT_USER } from '../../data/mockData';
import { useAuth } from '../../context';

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
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute display name and email from authenticated Supabase user or fallback
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    CURRENT_USER.name;
  const displayEmail = user?.email || CURRENT_USER.email;

  const handleLogout = async () => {
    setProfileOpen(false);
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

        <Link
          to="/notifications"
          className="icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="notification-indicator" />
        </Link>

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
            onClick={() => setProfileOpen((prev) => !prev)}
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
              status={CURRENT_USER.status}
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
