import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import { CURRENT_USER } from '../../data/mockData';
import { Avatar } from '../common/Avatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban, badge: '4' },
    { label: 'Kanban Board', path: '/workspace', icon: Columns3, badge: '6' },
    { label: 'Team Members', path: '/team', icon: Users, badge: '5' },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: '2' },
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
          <span>TeamFlow</span>
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

      {/* Footer User Profile */}
      <div className="sidebar-footer">
        <Link to="/settings" className="sidebar-user" onClick={onClose}>
          <Avatar
            name={CURRENT_USER.name}
            size="md"
            status={CURRENT_USER.status}
            showStatus
          />
          <div className="user-info">
            <span className="user-name">{CURRENT_USER.name}</span>
            <span className="user-role">{CURRENT_USER.role}</span>
          </div>
        </Link>
      </div>
    </aside>
  );
};
