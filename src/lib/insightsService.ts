import type { TaskWithAssignee } from './taskService';
import type { ProjectMemberWithProfile } from './projectService';

export type HealthStatus = 'Healthy' | 'Attention Needed' | 'At Risk' | 'No Data';

export interface HealthMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionProgress: number; // 0 to 100
  overdueCount: number;
  upcomingCount: number;
  status: HealthStatus;
  statusColor: string;
  statusBg: string;
  recommendations: string[];
}

export interface MemberWorkload {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role?: string;
  activeTasks: number; // non-completed tasks
  completedTasks: number;
  totalAssigned: number;
  percentageOfActive: number; // 0 to 100
}

export interface BlockedTasksInfo {
  isSupported: boolean;
  blockedCount: number;
  blockedTasks: TaskWithAssignee[];
  message: string;
}

export interface TeamInsightsData {
  health: HealthMetrics;
  memberWorkloads: MemberWorkload[];
  unassignedActiveTasks: number;
  blockedInfo: BlockedTasksInfo;
  isEmptyProject: boolean;
}

/**
 * Calculates project health status and transparent rule-based metrics
 * using the real task data.
 */
export function calculateProjectHealth(
  tasks: TaskWithAssignee[],
  referenceDate: Date = new Date()
): HealthMetrics {
  const totalTasks = tasks.length;

  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      todoTasks: 0,
      completionProgress: 0,
      overdueCount: 0,
      upcomingCount: 0,
      status: 'No Data',
      statusColor: '#64748b',
      statusBg: '#f1f5f9',
      recommendations: ['No tasks yet. Create your first task to start tracking velocity.']
    };
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;

  const completionProgress = Math.round((completedTasks / totalTasks) * 100);

  // Normalize reference date to the start of today in local time
  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  // Upcoming window: next 3 days inclusive (end of 3rd day)
  const endOf3Days = new Date(startOfToday.getTime() + 3 * 24 * 60 * 60 * 1000 + 86399999);

  let overdueCount = 0;
  let upcomingCount = 0;

  for (const task of tasks) {
    if (task.status === 'completed' || !task.deadline) {
      continue;
    }

    const taskDate = new Date(task.deadline);
    if (isNaN(taskDate.getTime())) {
      continue;
    }

    if (taskDate.getTime() < startOfToday.getTime()) {
      overdueCount++;
    } else if (taskDate.getTime() <= endOf3Days.getTime()) {
      upcomingCount++;
    }
  }

  // Determine health status using specified thresholds:
  // - At Risk: overdue > 2 OR completion progress < 30%
  // - Attention Needed: overdue <= 2 OR completion progress between 30% and 59%
  // - Healthy: overdue = 0 and completion progress >= 60%
  let status: HealthStatus;
  let statusColor: string;
  let statusBg: string;

  if (overdueCount > 2 || completionProgress < 30) {
    status = 'At Risk';
    statusColor = '#ef4444';
    statusBg = '#fee2e2';
  } else if (overdueCount === 0 && completionProgress >= 60) {
    status = 'Healthy';
    statusColor = '#16a34a';
    statusBg = '#dcfce7';
  } else {
    status = 'Attention Needed';
    statusColor = '#d97706';
    statusBg = '#fef3c7';
  }

  // Generate transparent rule-based recommendations from actual metrics
  const recommendations: string[] = [];

  if (overdueCount > 0) {
    recommendations.push(
      `${overdueCount} task${overdueCount > 1 ? 's are' : ' is'} overdue.`
    );
  }

  if (upcomingCount > 0) {
    recommendations.push(
      `${upcomingCount} deadline${upcomingCount > 1 ? 's are' : ' is'} due within 3 days.`
    );
  }

  if (completionProgress < 30) {
    recommendations.push(`Only ${completionProgress}% of tasks are completed.`);
  } else if (completionProgress < 60) {
    recommendations.push(`Task completion progress is at ${completionProgress}%.`);
  }

  if (status === 'Healthy' && recommendations.length === 0) {
    recommendations.push(
      `Project is on track with ${completionProgress}% completion and zero overdue tasks.`
    );
  }

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionProgress,
    overdueCount,
    upcomingCount,
    status,
    statusColor,
    statusBg,
    recommendations
  };
}

/**
 * Calculates active tasks count and distribution per member.
 * Active tasks are defined as non-completed tasks (todo or in_progress).
 */
export function calculateMemberWorkload(
  tasks: TaskWithAssignee[],
  members: ProjectMemberWithProfile[]
): { workloads: MemberWorkload[]; unassignedActiveCount: number } {
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const totalActiveTasks = activeTasks.length;

  const unassignedActiveCount = activeTasks.filter((t) => !t.assigned_user_id).length;

  const workloads: MemberWorkload[] = members.map((m) => {
    const memberActive = activeTasks.filter((t) => t.assigned_user_id === m.user_id).length;
    const memberCompleted = tasks.filter(
      (t) => t.assigned_user_id === m.user_id && t.status === 'completed'
    ).length;

    const percentageOfActive =
      totalActiveTasks > 0 ? Math.round((memberActive / totalActiveTasks) * 100) : 0;

    return {
      userId: m.user_id,
      name: m.profile?.full_name || 'Member',
      avatarUrl: m.profile?.avatar_url || null,
      role: m.role,
      activeTasks: memberActive,
      completedTasks: memberCompleted,
      totalAssigned: memberActive + memberCompleted,
      percentageOfActive
    };
  });

  // Sort descending by active tasks
  workloads.sort((a, b) => b.activeTasks - a.activeTasks);

  return { workloads, unassignedActiveCount };
}

/**
 * Checks for blocked tasks based on database dependency fields.
 * If dependencies are not supported by the database, gracefully shows "No dependency data available".
 */
export function calculateBlockedTasks(tasks: TaskWithAssignee[]): BlockedTasksInfo {
  const hasDependencyField = tasks.some(
    (t) =>
      Object.prototype.hasOwnProperty.call(t, 'depends_on') ||
      Object.prototype.hasOwnProperty.call(t, 'blocked_by') ||
      Object.prototype.hasOwnProperty.call(t, 'dependencies')
  );

  if (!hasDependencyField) {
    return {
      isSupported: false,
      blockedCount: 0,
      blockedTasks: [],
      message: 'No dependency data available'
    };
  }

  const blockedTasks = tasks.filter(
    (t: any) => t.status !== 'completed' && Boolean(t.blocked_by || t.depends_on)
  );

  return {
    isSupported: true,
    blockedCount: blockedTasks.length,
    blockedTasks,
    message:
      blockedTasks.length > 0
        ? `${blockedTasks.length} task${blockedTasks.length > 1 ? 's' : ''} blocked by dependencies`
        : 'All active tasks are unblocked'
  };
}

/**
 * Aggregates complete Team Insights data for a project.
 */
export function getTeamInsights(
  tasks: TaskWithAssignee[],
  members: ProjectMemberWithProfile[],
  referenceDate: Date = new Date()
): TeamInsightsData {
  const health = calculateProjectHealth(tasks, referenceDate);
  const { workloads, unassignedActiveCount } = calculateMemberWorkload(tasks, members);
  const blockedInfo = calculateBlockedTasks(tasks);

  // Add workload and unassigned alerts to recommendations if applicable
  if (workloads.length > 0 && workloads[0].activeTasks >= 3) {
    health.recommendations.push(
      `High workload on ${workloads[0].name} (${workloads[0].activeTasks} active tasks).`
    );
  }

  if (unassignedActiveCount > 0) {
    health.recommendations.push(
      `${unassignedActiveCount} active task${unassignedActiveCount > 1 ? 's are' : ' is'} currently unassigned.`
    );
  }

  return {
    health,
    memberWorkloads: workloads,
    unassignedActiveTasks: unassignedActiveCount,
    blockedInfo,
    isEmptyProject: tasks.length === 0
  };
}
