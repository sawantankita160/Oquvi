import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Plus, Home } from 'lucide-react';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { CURRENT_USER } from '../../data/mockData';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNewProjectClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onNewProjectClick
}) => {
  const navigate = useNavigate();

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

        <Link to="/settings" style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            name={CURRENT_USER.name}
            size="md"
            status={CURRENT_USER.status}
            showStatus
          />
        </Link>
      </div>
    </header>
  );
};
