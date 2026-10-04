import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import {
  LandingPage,
  DashboardPage,
  ProjectsPage,
  WorkspacePage,
  TeamPage,
  NotificationsPage,
  SettingsPage,
  NotFoundPage,
  LoginPage,
  SignupPage
} from '../pages';

/**
 * Oquvi - Central Application Routes
 * 
 * Public Routes:
 * - / -> Marketing Landing Page
 * - /login -> Supabase Authentication Login
 * - /signup -> Supabase Authentication Sign Up
 * 
 * Protected Routes (Requires Supabase Session):
 * - /dashboard -> Main Sprint Dashboard
 * - /projects -> Projects Catalog & Filters
 * - /workspace -> Sprint Kanban Board (To Do, In Progress, Completed)
 * - /team -> Team Members Directory
 * - /notifications -> Notifications & Activity Feed
 * - /settings -> Workspace & Profile Settings
 */

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected Workspace Shell Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
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
