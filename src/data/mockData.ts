/**
 * Oquvi - Mock Seed Data
 * 
 * Realistic sample data for the collaborative project workspace with Indian student/professional context.
 */

import type {
  User,
  Project,
  Task,
  WorkspaceActivity,
  WorkspaceStat,
  AppNotification
} from '../types';

export const CURRENT_USER: User = {
  id: 'user-1',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@oquvi.dev',
  role: 'Admin',
  status: 'online',
  department: 'Core Engineering'
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: 'user-2',
    name: 'Ananya Patil',
    email: 'ananya.patil@oquvi.dev',
    role: 'Member',
    status: 'online',
    department: 'UI/UX Design'
  },
  {
    id: 'user-3',
    name: 'Rohan Kulkarni',
    email: 'rohan.kulkarni@oquvi.dev',
    role: 'Member',
    status: 'busy',
    department: 'Backend Infrastructure'
  },
  {
    id: 'user-4',
    name: 'Sneha Joshi',
    email: 'sneha.joshi@oquvi.dev',
    role: 'Member',
    status: 'away',
    department: 'Product Management'
  },
  {
    id: 'user-5',
    name: 'Aditya Deshmukh',
    email: 'aditya.deshmukh@oquvi.dev',
    role: 'Member',
    status: 'offline',
    department: 'AI Research'
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'CampusConnect Portal',
    description: 'Comprehensive campus placement and student collaboration network with real-time peer groups.',
    status: 'in_progress',
    priority: 'urgent',
    progress: 72,
    memberIds: ['user-1', 'user-3'],
    dueDate: 'Oct 15, 2026',
    category: 'Backend',
    tasksCount: { total: 18, completed: 13 }
  },
  {
    id: 'proj-2',
    title: 'SevaSetu Citizen Gateway',
    description: 'Citizen service delivery hub with transparent tracking, automated grievance alerts, and localized dashboards.',
    status: 'in_progress',
    priority: 'high',
    progress: 88,
    memberIds: ['user-1', 'user-2'],
    dueDate: 'Oct 10, 2026',
    category: 'Design',
    tasksCount: { total: 14, completed: 12 }
  },
  {
    id: 'proj-3',
    title: 'StudySync AI Assistant',
    description: 'Intelligent academic workspace that summarizes lecture notes, schedules peer revisions, and tracks milestones.',
    status: 'planning',
    priority: 'medium',
    progress: 30,
    memberIds: ['user-4', 'user-5'],
    dueDate: 'Nov 02, 2026',
    category: 'AI / ML',
    tasksCount: { total: 8, completed: 3 }
  },
  {
    id: 'proj-4',
    title: 'EventMitra Hackathon Hub',
    description: 'National hackathon coordination platform with live project submissions, mentor round slots, and team evaluations.',
    status: 'completed',
    priority: 'high',
    progress: 100,
    memberIds: ['user-1', 'user-4', 'user-2'],
    dueDate: 'Oct 04, 2026',
    category: 'Hackathon',
    tasksCount: { total: 6, completed: 6 }
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Setup real-time state sync on CampusConnect gateway',
    description: 'Ensure client sockets recover gracefully when connectivity drops.',
    status: 'todo',
    priority: 'urgent',
    assignee: CURRENT_USER,
    dueDate: 'Tomorrow',
    tags: ['Network', 'Sync']
  },
  {
    id: 'task-2',
    projectId: 'proj-2',
    title: 'Design accessible soft lavender UI components for SevaSetu portal',
    description: 'Add subtle hover lift, crisp typography, and smooth focus rings.',
    status: 'in_progress',
    priority: 'high',
    assignee: MOCK_USERS[1],
    dueDate: 'Oct 08',
    tags: ['Design', 'CSS']
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    title: 'Optimize database index queries for EventMitra student directory',
    description: 'Benchmarked fast response times when handling 50+ concurrent requests.',
    status: 'in_progress',
    priority: 'medium',
    assignee: MOCK_USERS[2],
    dueDate: 'Oct 10',
    tags: ['Performance']
  },
  {
    id: 'task-4',
    projectId: 'proj-2',
    title: 'Deploy interactive verification badge system for CampusConnect',
    description: 'All status tags now have accessible color contrasts and pastel indicators.',
    status: 'completed',
    priority: 'medium',
    assignee: CURRENT_USER,
    dueDate: 'Completed',
    tags: ['Components']
  },
  {
    id: 'task-5',
    projectId: 'proj-3',
    title: 'Train NLP model prompts on StudySync for lecture transcription notes',
    description: 'Extract blockers, key concepts, and actionable flashcards from audio transcripts.',
    status: 'todo',
    priority: 'medium',
    assignee: MOCK_USERS[4],
    dueDate: 'Oct 12',
    tags: ['AI']
  },
  {
    id: 'task-6',
    projectId: 'proj-4',
    title: 'Complete final pitch deck and demo recording for EventMitra',
    description: 'Highlight real-time board movement, student presence, and sprint telemetry.',
    status: 'completed',
    priority: 'urgent',
    assignee: MOCK_USERS[3],
    dueDate: 'Completed',
    tags: ['Demo']
  }
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'New Mention in Project',
    message: 'Ananya Patil mentioned you in "SevaSetu Citizen Gateway": "Let\'s check the contrast on the active tab indicator."',
    type: 'mention',
    timestamp: '10m ago',
    read: false,
    userName: 'Ananya Patil',
    target: 'proj-2'
  },
  {
    id: 'notif-2',
    title: 'Task Assigned to You',
    message: 'Rohan Kulkarni assigned you the task: "Setup real-time state sync on CampusConnect gateway".',
    type: 'assignment',
    timestamp: '45m ago',
    read: false,
    userName: 'Rohan Kulkarni',
    target: 'task-1'
  },
  {
    id: 'notif-3',
    title: 'Project Milestone Achieved',
    message: '"EventMitra Hackathon Hub" was marked as 100% completed by Sneha Joshi.',
    type: 'project',
    timestamp: '3h ago',
    read: true,
    userName: 'Sneha Joshi',
    target: 'proj-4'
  },
  {
    id: 'notif-4',
    title: 'System Security Notice',
    message: 'Automated Oquvi workspace snapshot created and encrypted successfully.',
    type: 'system',
    timestamp: '1d ago',
    read: true
  }
];

export const MOCK_ACTIVITIES: WorkspaceActivity[] = [
  {
    id: 'act-1',
    user: { name: 'Ananya Patil' },
    action: 'updated the design tokens for',
    target: 'SevaSetu Citizen Gateway',
    timestamp: '12m ago'
  },
  {
    id: 'act-2',
    user: { name: 'Aarav Sharma' },
    action: 'moved task to In Progress on',
    target: 'CampusConnect Portal',
    timestamp: '34m ago'
  },
  {
    id: 'act-3',
    user: { name: 'Rohan Kulkarni' },
    action: 'connected repository webhook for',
    target: 'EventMitra Hackathon Hub',
    timestamp: '2h ago'
  },
  {
    id: 'act-4',
    user: { name: 'Sneha Joshi' },
    action: 'created new project requirement on',
    target: 'StudySync AI Assistant',
    timestamp: '4h ago'
  }
];

export const MOCK_STATS: WorkspaceStat[] = [
  {
    id: 'stat-1',
    label: 'Active Projects',
    value: '4',
    change: '+2 this sprint',
    isPositive: true,
    iconName: 'FolderKanban'
  },
  {
    id: 'stat-2',
    label: 'Sprint Tasks',
    value: '6',
    change: '2 completed today',
    isPositive: true,
    iconName: 'CheckSquare'
  },
  {
    id: 'stat-3',
    label: 'Team Members',
    value: '5',
    change: '3 currently active',
    isPositive: true,
    iconName: 'Users'
  },
  {
    id: 'stat-4',
    label: 'Sprint Velocity',
    value: '92%',
    change: '+14% pace',
    isPositive: true,
    iconName: 'Zap'
  }
];
