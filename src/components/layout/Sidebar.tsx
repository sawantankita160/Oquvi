import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Columns3,
  Users,
  Bell,
  Settings,
  X,
  Layers,
  ExternalLink,
  Sparkles,
  LogOut
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Team Member';

  const handleLogout = async () => {
    onClose();
    await signOut();
    navigate('/login', { replace: true });
  };
  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Kanban Board', path: '/workspace', icon: Columns3 },
    { label: 'Team Members', path: '/team', icon: Users },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <Link to="/" className="brand-logo" onClick={onClose} title="Go to Landing Page">
          <div className="brand-icon">
            <Layers size={20} />
          </div>
          <span>Oquvi</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Workspace Indicator */}
      <div className="workspace-badge">
        <span className="workspace-badge-dot" />
        <span>Hackathon Sprint #1</span>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Workspace Views</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <div className="nav-item-content">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="nav-item-badge">{item.badge}</span>
              )}
            </NavLink>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: '16px' }}>
          Explore
        </div>
        <Link
          to="/"
          className="nav-item"
          onClick={onClose}
          title="Visit marketing landing page"
        >
          <div className="nav-item-content">
            <ExternalLink size={18} color="var(--primary)" />
            <span>Landing Page</span>
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              background: 'var(--bg-lavender-subtle)',
              color: 'var(--primary)',
              padding: '2px 7px',
              borderRadius: '9999px',
              fontWeight: 600
            }}
          >
            Public
          </span>
        </Link>

        <div
          className="nav-item"
          style={{ opacity: 0.8, cursor: 'default' }}
          title="AI Assistant preview"
        >
          <div className="nav-item-content">
            <Sparkles size={18} color="#7c3aed" />
            <span>AI Copilot</span>
          </div>
          <span
            style={{
              fontSize: '0.65rem',
              background: 'var(--bg-lavender-subtle)',
              color: '#7c3aed',
              padding: '2px 6px',
              borderRadius: '9999px',
              fontWeight: 600
            }}
          >
            BETA
          </span>
        </div>
      </nav>

      {/* Footer User Profile with Logout */}
      <div className="sidebar-footer">
        <Link to="/settings" className="sidebar-user" onClick={onClose} style={{ flex: 1 }}>
          <Avatar
            name={displayName}
            size="md"
            status="online"
            showStatus
          />
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{user ? user.email : 'Collaborator'}</span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign Out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--rose-500)';
            e.currentTarget.style.background = '#ffe4e6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-dim)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
