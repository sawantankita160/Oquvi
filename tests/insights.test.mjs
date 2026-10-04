import test from 'node:test';
import assert from 'node:assert/strict';

// Import compiled or ES modules. Since Vite/TS is used, we can dynamically import or write native assertions matching insightsService logic
// Or test using ts-node or node with test runner on transpiled code or standalone pure JS test mirroring the service
import {
  calculateProjectHealth,
  calculateMemberWorkload,
  calculateBlockedTasks,
  getTeamInsights
} from '../src/lib/insightsService.ts';

const refDate = new Date('2026-10-04T12:00:00Z');

function createMockTask(overrides = {}) {
  return {
    id: 'task-' + Math.random().toString(36).substring(7),
    project_id: 'proj-1',
    title: 'Test Task',
    description: null,
    status: 'todo',
    priority: 'medium',
    deadline: null,
    assigned_user_id: null,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    assignee: null,
    ...overrides
  };
}

function createMockMember(userId, name, role = 'member') {
  return {
    id: 'member-' + userId,
    user_id: userId,
    role,
    profile: {
      full_name: name,
      avatar_url: null
    }
  };
}

test('Project Health - Empty Project returns No Data and zero metrics', () => {
  const result = calculateProjectHealth([], refDate);
  assert.equal(result.totalTasks, 0);
  assert.equal(result.completedTasks, 0);
  assert.equal(result.completionProgress, 0);
  assert.equal(result.overdueCount, 0);
  assert.equal(result.upcomingCount, 0);
  assert.equal(result.status, 'No Data');
  assert.match(result.recommendations[0], /no tasks yet/i);
});

test('Project Health - Healthy when overdue is 0 and completion progress >= 60%', () => {
  const tasks = [
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'in_progress', deadline: '2026-10-20T00:00:00Z' }),
    createMockTask({ status: 'todo', deadline: '2026-10-25T00:00:00Z' })
  ]; // 3/5 = 60% completed, 0 overdue

  const result = calculateProjectHealth(tasks, refDate);
  assert.equal(result.completionProgress, 60);
  assert.equal(result.overdueCount, 0);
  assert.equal(result.status, 'Healthy');
});

test('Project Health - Attention Needed when completion is 30-59% with overdue <= 2', () => {
  const tasks = [
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'in_progress' }),
    createMockTask({ status: 'todo' }),
    createMockTask({ status: 'todo' })
  ]; // 2/5 = 40% completed, 0 overdue

  const result = calculateProjectHealth(tasks, refDate);
  assert.equal(result.completionProgress, 40);
  assert.equal(result.overdueCount, 0);
  assert.equal(result.status, 'Attention Needed');
});

test('Project Health - Attention Needed when completion is >= 60% but has 1 overdue task', () => {
  const tasks = [
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'in_progress', deadline: '2026-10-01T00:00:00Z' }) // Overdue (Oct 1 < Oct 4)
  ]; // 3/4 = 75%, 1 overdue

  const result = calculateProjectHealth(tasks, refDate);
  assert.equal(result.completionProgress, 75);
  assert.equal(result.overdueCount, 1);
  assert.equal(result.status, 'Attention Needed');
});

test('Project Health - At Risk when completion progress < 30%', () => {
  const tasks = [
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'todo' }),
    createMockTask({ status: 'todo' }),
    createMockTask({ status: 'todo' }),
    createMockTask({ status: 'todo' })
  ]; // 1/5 = 20% completed

  const result = calculateProjectHealth(tasks, refDate);
  assert.equal(result.completionProgress, 20);
  assert.equal(result.status, 'At Risk');
});

test('Project Health - At Risk when overdue tasks > 2 regardless of completion', () => {
  const tasks = [
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'completed' }),
    createMockTask({ status: 'in_progress', deadline: '2026-09-25T00:00:00Z' }), // overdue 1
    createMockTask({ status: 'in_progress', deadline: '2026-09-28T00:00:00Z' }), // overdue 2
    createMockTask({ status: 'todo', deadline: '2026-10-01T00:00:00Z' })        // overdue 3
  ]; // 4/7 = 57%, 3 overdue

  const result = calculateProjectHealth(tasks, refDate);
  assert.equal(result.overdueCount, 3);
  assert.equal(result.status, 'At Risk');
});

test('Project Health - Accurately counts upcoming deadlines within 3 days', () => {
  const tasks = [
    createMockTask({ status: 'in_progress', deadline: '2026-10-05T10:00:00Z' }), // tomorrow (within 3 days)
    createMockTask({ status: 'todo', deadline: '2026-10-06T15:00:00Z' }),        // in 2 days (within 3 days)
    createMockTask({ status: 'todo', deadline: '2026-10-07T12:00:00Z' }),        // in 3 days (within 3 days)
    createMockTask({ status: 'todo', deadline: '2026-10-15T00:00:00Z' }),        // in 11 days (NOT within 3 days)
    createMockTask({ status: 'completed', deadline: '2026-10-05T10:00:00Z' })   // completed (ignored)
  ];

  const result = calculateProjectHealth(tasks, refDate);
  assert.equal(result.upcomingCount, 3);
});

test('Member Workload - Counts active non-completed tasks and calculates distribution', () => {
  const memberA = createMockMember('user-a', 'Sameer Jadhav');
  const memberB = createMockMember('user-b', 'Ankita Patil');

  const tasks = [
    createMockTask({ assigned_user_id: 'user-a', status: 'todo' }),
    createMockTask({ assigned_user_id: 'user-a', status: 'in_progress' }),
    createMockTask({ assigned_user_id: 'user-a', status: 'completed' }), // Completed not active
    createMockTask({ assigned_user_id: 'user-b', status: 'todo' }),
    createMockTask({ assigned_user_id: null, status: 'in_progress' })     // Unassigned
  ];

  const { workloads, unassignedActiveCount } = calculateMemberWorkload(tasks, [memberA, memberB]);

  assert.equal(unassignedActiveCount, 1);
  const workloadA = workloads.find((w) => w.userId === 'user-a');
  const workloadB = workloads.find((w) => w.userId === 'user-b');

  assert.equal(workloadA?.activeTasks, 2);
  assert.equal(workloadA?.completedTasks, 1);
  assert.equal(workloadB?.activeTasks, 1);
  assert.equal(workloadB?.completedTasks, 0);
});

test('Blocked Tasks - Gracefully handles database without dependencies', () => {
  const tasks = [createMockTask({ status: 'todo' })];
  const blocked = calculateBlockedTasks(tasks);

  assert.equal(blocked.isSupported, false);
  assert.equal(blocked.blockedCount, 0);
  assert.equal(blocked.message, 'No dependency data available');
});

test('Team Insights - Aggregates complete insights with transparent recommendations', () => {
  const memberA = createMockMember('user-a', 'Sameer Jadhav');
  const tasks = [
    createMockTask({ assigned_user_id: 'user-a', status: 'todo', deadline: '2026-09-30T00:00:00Z' }), // overdue
    createMockTask({ assigned_user_id: 'user-a', status: 'in_progress', deadline: '2026-10-05T00:00:00Z' }), // upcoming
    createMockTask({ assigned_user_id: 'user-a', status: 'todo' }), // 3rd task on member A
    createMockTask({ assigned_user_id: null, status: 'todo' }) // unassigned
  ];

  const insights = getTeamInsights(tasks, [memberA], refDate);

  assert.equal(insights.isEmptyProject, false);
  assert.equal(insights.health.overdueCount, 1);
  assert.equal(insights.health.upcomingCount, 1);
  assert.equal(insights.unassignedActiveTasks, 1);

  // Recommendations should mention overdue, upcoming, low completion, workload, and unassigned
  const allRecs = insights.health.recommendations.join(' ');
  assert.match(allRecs, /1 task is overdue/);
  assert.match(allRecs, /1 deadline is due within 3 days/);
  assert.match(allRecs, /Only 0% of tasks are completed/);
  assert.match(allRecs, /High workload on Sameer Jadhav/);
  assert.match(allRecs, /1 active task is currently unassigned/);
});
