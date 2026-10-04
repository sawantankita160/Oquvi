import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import {
  LandingPage,
  DashboardPage,
  ProjectsPage,
  WorkspacePage,
  TeamPage,
  NotificationsPage,
  SettingsPage,
  NotFoundPage
} from '../pages';

/**
 * TeamFlow - Central Application Routes
 * 
 * Routes:
 * - / -> Marketing Landing Page (Interactive Hero, Mockups, Feature Pillars)
 * - /dashboard -> SaaS Dashboard Workspace
 * - /projects -> Projects Catalog & Filters
 * - /workspace -> Sprint Kanban Board (To Do, In Progress, Completed)
 * - /team -> Team Members Directory
 * - /notifications -> Notifications & Activity Feed
 * - /settings -> Workspace & Profile Settings
 */

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Marketing Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Authenticated / Workspace App Shell */}
      <Route element={<AppLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="workspace" element={<WorkspacePage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Handy Aliases */}
        <Route path="app" element={<Navigate to="/dashboard" replace />} />
        <Route path="kanban" element={<Navigate to="/workspace" replace />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
