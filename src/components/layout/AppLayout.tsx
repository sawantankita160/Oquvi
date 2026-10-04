import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

/**
 * Oquvi - App Shell Layout
 * 
 * Beginner Note:
 * In React Router v6+, <Outlet /> renders whichever child route is currently active
 * (e.g. DashboardPage, ProjectsPage, WorkspacePage) inside this shared frame.
 */

export const AppLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleToggleSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleNewProject = () => {
    navigate('/projects');
  };

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${isMobileSidebarOpen ? 'open' : ''}`}
        onClick={handleCloseSidebar}
      />

      {/* Persistent / Responsive Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          onNewProjectClick={handleNewProject}
        />

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
