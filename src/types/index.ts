/**
 * Oquvi - Core TypeScript Definitions
 * 
 * Clean, well-typed interfaces for the Collaborative Project Workspace.
 */

export type { Database, Json, ProjectMemberRole } from './database';

export type UserStatus = 'online' | 'offline' | 'busy' | 'away';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Admin' | 'Member' | 'Guest' | 'Viewer';
  status: UserStatus;
  department?: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  progress: number; // 0 to 100 percentage
  memberIds: string[];
  dueDate: string;
  category: 'Frontend' | 'Backend' | 'Design' | 'AI / ML' | 'DevOps' | 'Hackathon';
  tasksCount: {
    total: number;
    completed: number;
  };
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: PriorityLevel;
  assignee?: User;
  dueDate: string;
  tags: string[];
}

export interface WorkspaceActivity {
  id: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
  action: string;
  target: string;
  timestamp: string;
}

export interface WorkspaceStat {
  id: string;
  label: string;
  value: string | number;
  change: string; // e.g. "+14% from last week"
  isPositive: boolean;
  iconName: string;
}

export type NotificationType = 'mention' | 'assignment' | 'project' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  userName?: string;
  target?: string;
}
