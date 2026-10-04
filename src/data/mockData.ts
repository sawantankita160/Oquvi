/**
 * TeamFlow - Mock Seed Data
 * 
 * Realistic sample data for the collaborative project workspace.
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
  name: 'Alex Rivera',
  email: 'alex.rivera@teamflow.dev',
  role: 'Admin',
  status: 'online',
  department: 'Core Engineering'
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: 'user-2',
    name: 'Sarah Connor',
    email: 'sarah.c@teamflow.dev',
    role: 'Member',
    status: 'online',
    department: 'UI/UX Design'
  },
  {
    id: 'user-3',
    name: 'David Kim',
    email: 'david.k@teamflow.dev',
    role: 'Member',
    status: 'busy',
    department: 'Backend Infrastructure'
  },
  {
    id: 'user-4',
    name: 'Maya Patel',
    email: 'maya.p@teamflow.dev',
    role: 'Member',
    status: 'away',
    department: 'Product Management'
  },
  {
    id: 'user-5',
    name: 'Liam Zhang',
    email: 'liam.z@teamflow.dev',
    role: 'Member',
    status: 'offline',
    department: 'AI Research'
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'TeamFlow Real-Time Engine',
    description: 'High-performance collaborative state sync using WebSockets and CRDTs.',
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
    title: 'Soft Lavender SaaS UI Design',
    description: 'Accessible, reusable React UI components with sleek white and lavender aesthetics.',
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
    title: 'AI Smart Task Summarizer',
    description: 'Natural language workspace assistant to generate standup notes and action items.',
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
    title: 'Collaborative Sprint Showcase',
    description: 'Interactive prototype pitch, slide deck walkthrough, and demo scripts.',
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
    title: 'Configure WebSocket server heartbeat ping and reconnection protocol',
    description: 'Ensure client sockets recover gracefully when network drops.',
    status: 'todo',
    priority: 'urgent',
    assignee: CURRENT_USER,
    dueDate: 'Tomorrow',
    tags: ['Network', 'Sync']
  },
  {
    id: 'task-2',
    projectId: 'proj-2',
    title: 'Implement soft lavender card styling and rounded button micro-animations',
    description: 'Add subtle hover lift and smooth focus rings.',
    status: 'in_progress',
    priority: 'high',
    assignee: MOCK_USERS[1],
    dueDate: 'Oct 08',
    tags: ['Design', 'CSS']
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    title: 'Optimize state reconciler algorithm for board cards',
    description: 'Benchmarked 60fps renders when 50+ cards update concurrently.',
    status: 'in_progress',
    priority: 'medium',
    assignee: MOCK_USERS[2],
    dueDate: 'Oct 10',
    tags: ['Performance']
  },
  {
    id: 'task-4',
    projectId: 'proj-2',
    title: 'Create Badge and StatCard reusable primitives with pastel indicators',
    description: 'All status tags now have accessible color contrasts.',
    status: 'completed',
    priority: 'medium',
    assignee: CURRENT_USER,
    dueDate: 'Completed',
    tags: ['Components']
  },
  {
    id: 'task-5',
    projectId: 'proj-3',
    title: 'Fine-tune AI prompt templates for automated standup summaries',
    description: 'Extract blockers and key decisions from yesterday activity.',
    status: 'todo',
    priority: 'medium',
    assignee: MOCK_USERS[4],
    dueDate: 'Oct 12',
    tags: ['AI']
  },
  {
    id: 'task-6',
    projectId: 'proj-4',
    title: 'Record 3-minute hackathon demo video walkthrough',
    description: 'Highlight real-time board movement and member presence.',
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
    message: 'Sarah Connor mentioned you in "Soft Lavender SaaS UI Design": "Let\'s check the contrast on the active tab indicator."',
    type: 'mention',
    timestamp: '10m ago',
    read: false,
    userName: 'Sarah Connor',
    target: 'proj-2'
  },
  {
    id: 'notif-2',
    title: 'Task Assigned to You',
    message: 'David Kim assigned you the task: "Configure WebSocket server heartbeat ping".',
    type: 'assignment',
    timestamp: '45m ago',
    read: false,
    userName: 'David Kim',
    target: 'task-1'
  },
  {
    id: 'notif-3',
    title: 'Project Milestone Achieved',
    message: '"Collaborative Sprint Showcase" was marked as 100% completed by Maya Patel.',
    type: 'project',
    timestamp: '3h ago',
    read: true,
    userName: 'Maya Patel',
    target: 'proj-4'
  },
  {
    id: 'notif-4',
    title: 'System Security Notice',
    message: 'Automated workspace snapshot created and encrypted successfully.',
    type: 'system',
    timestamp: '1d ago',
    read: true
  }
];

export const MOCK_ACTIVITIES: WorkspaceActivity[] = [
  {
    id: 'act-1',
    user: { name: 'Sarah Connor' },
    action: 'updated the design tokens for',
    target: 'Soft Lavender SaaS UI Design',
    timestamp: '12m ago'
  },
  {
    id: 'act-2',
    user: { name: 'Alex Rivera' },
    action: 'moved task to In Progress on',
    target: 'Real-Time Sync Gateway',
    timestamp: '34m ago'
  },
  {
    id: 'act-3',
    user: { name: 'David Kim' },
    action: 'connected repository webhook for',
    target: 'Backend Infrastructure',
    timestamp: '2h ago'
  },
  {
    id: 'act-4',
    user: { name: 'Maya Patel' },
    action: 'created new project requirement',
    target: 'AI Smart Task Summarizer',
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
