import React from 'react';
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  ShieldAlert,
  ShieldCheck,
  Info,
  Lock,
  Plus,
  TrendingUp,
  BarChart3,
  Columns3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody, Button, Avatar } from '../common';
import { getTeamInsights, type TeamInsightsData } from '../../lib/insightsService';
import type { TaskWithAssignee } from '../../lib/taskService';
import type { ProjectMemberWithProfile } from '../../lib/projectService';

export interface TeamInsightsProps {
  tasks: TaskWithAssignee[];
  members: ProjectMemberWithProfile[];
  projectName?: string;
  onNavigateToBoard?: () => void;
  onAddTask?: () => void;
}

export const TeamInsights: React.FC<TeamInsightsProps> = ({
  tasks,
  members,
  projectName = 'Current Project',
  onNavigateToBoard,
  onAddTask
}) => {
  const insights: TeamInsightsData = React.useMemo(() => {
    return getTeamInsights(tasks, members);
  }, [tasks, members]);

  const { health, memberWorkloads, unassignedActiveTasks, blockedInfo, isEmptyProject } = insights;

  // Maximum active tasks among members for bar chart scaling
  const maxActiveTasks = Math.max(
    1,
    ...memberWorkloads.map((w) => w.activeTasks),
    unassignedActiveTasks
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header & Quick Health Banner */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '6px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--bg-lavender-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BarChart3 size={18} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Team Insights & Project Telemetry
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
                background: health.statusBg,
                color: health.statusColor,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {health.status === 'Healthy' && <ShieldCheck size={13} />}
              {health.status === 'Attention Needed' && <AlertTriangle size={13} />}
              {health.status === 'At Risk' && <ShieldAlert size={13} />}
              {health.status === 'No Data' && <Info size={13} />}
              {health.status}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time health formulas, member workload distribution, and rule-based recommendations for{' '}
            <strong style={{ color: 'var(--text-main)' }}>{projectName}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onNavigateToBoard && (
            <Button variant="outline" size="sm" icon={<Columns3 size={14} />} onClick={onNavigateToBoard}>
              Kanban Board
            </Button>
          )}
          {onAddTask && (
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={onAddTask}>
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* 2. Empty State View if Project has No Tasks */}
      {isEmptyProject ? (
        <Card>
          <CardBody style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--bg-lavender-subtle)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <Activity size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
              No tasks yet in this workspace
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                maxWidth: '460px',
                margin: '0 auto 20px'
              }}
            >
              Add tasks to start calculating live project velocity, health thresholds, and member workload distributions.
            </p>
            {onAddTask && (
              <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={onAddTask}>
                Create Your First Task
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <>
          {/* 3. Top Metrics Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            {/* Health Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                padding: '16px 20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Project Health
                </span>
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: health.statusBg,
                    color: health.statusColor,
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {health.status}
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: health.statusColor }}>
                  {health.completionProgress}%
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {health.completedTasks} of {health.totalTasks} tasks completed
                </div>
              </div>
            </div>

            {/* Active Tasks */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                padding: '16px 20px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Active Tasks
                </span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-lavender-subtle)',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  To Do & In Progress
                </span>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {health.inProgressTasks + health.todoTasks}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {health.inProgressTasks} in progress · {health.todoTasks} to do
                </div>
              </div>
            </div>

            {/* Overdue Tasks */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                padding: '16px 20px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Overdue Tasks
                </span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: health.overdueCount > 0 ? '#fee2e2' : '#f1f5f9',
                    color: health.overdueCount > 0 ? '#ef4444' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {health.overdueCount > 0 ? 'Urgent' : 'Clear'}
                </span>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div
                  style={{
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    color: health.overdueCount > 0 ? '#ef4444' : 'var(--text-main)'
                  }}
                >
                  {health.overdueCount}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {health.overdueCount > 0 ? 'Due date has passed' : 'Zero overdue deadlines'}
                </div>
              </div>
            </div>

            {/* Upcoming 3-Day Deadlines */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                padding: '16px 20px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Due Within 3 Days
                </span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: health.upcomingCount > 0 ? '#fef3c7' : '#f1f5f9',
                    color: health.upcomingCount > 0 ? '#d97706' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  Next 72 Hours
                </span>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div
                  style={{
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    color: health.upcomingCount > 0 ? '#d97706' : 'var(--text-main)'
                  }}
                >
                  {health.upcomingCount}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {health.upcomingCount > 0 ? 'Approaching deadlines' : 'No immediate deadlines'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Two-Column Layout: Project Health Detail & Recommendations */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px'
            }}
          >
            {/* Card A: Project Health & Transparent Numbers */}
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="var(--primary)" />
                  <CardTitle>Project Health Breakdown</CardTitle>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Transparent Metrics
                </span>
              </CardHeader>
              <CardBody>
                {/* Progress bar */}
                <div style={{ marginBottom: '18px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      marginBottom: '6px'
                    }}
                  >
                    <span>Overall Completion</span>
                    <span style={{ color: health.statusColor }}>{health.completionProgress}%</span>
                  </div>
                  <div
                    style={{
                      height: '10px',
                      background: '#e2e8f0',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      display: 'flex'
                    }}
                  >
                    <div
                      style={{
                        width: `${health.completionProgress}%`,
                        background: health.status === 'Healthy' ? '#10b981' : health.statusColor,
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Key Metrics Chips */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    marginBottom: '16px'
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      Completed Tasks
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#16a34a' }}>
                      {health.completedTasks}{' '}
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                        ({health.completionProgress}%)
                      </span>
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      In Progress
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7' }}>
                      {health.inProgressTasks}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      To Do Tasks
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#64748b' }}>
                      {health.todoTasks}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      Total Project Tasks
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {health.totalTasks}
                    </span>
                  </div>
                </div>

                {/* Transparent Formula Explainer */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-lavender-subtle)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.45
                  }}
                >
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>
                    Formula Thresholds:
                  </strong>
                  • <strong>Healthy:</strong> 0 overdue tasks AND ≥ 60% completion.
                  <br />
                  • <strong>Attention Needed:</strong> ≤ 2 overdue OR 30%–59% completion.
                  <br />
                  • <strong>At Risk:</strong> &gt; 2 overdue OR &lt; 30% completion.
                </div>
              </CardBody>
            </Card>

            {/* Card B: Why This Project Needs Attention */}
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color="var(--primary)" />
                  <CardTitle>Why This Project Needs Attention</CardTitle>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    background: 'var(--bg-lavender-subtle)',
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  }}
                >
                  Rule-Based Insights
                </span>
              </CardHeader>
              <CardBody>
                {health.recommendations.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 16px',
                      textAlign: 'center',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <CheckCircle2 size={28} color="#16a34a" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>
                      No critical attention flags
                    </p>
                    <span style={{ fontSize: '0.8rem' }}>All milestones are tracking smoothly.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {health.recommendations.map((rec, index) => {
                      const isOverdueAlert = rec.includes('overdue');
                      const isDeadlineAlert = rec.includes('within 3 days');
                      const isLowProgress = rec.includes('Only');
                      const isWorkloadAlert = rec.includes('High workload');
                      const isUnassigned = rec.includes('unassigned');

                      let itemIcon = <Info size={16} color="var(--primary)" />;
                      let itemBg = '#f8fafc';
                      let itemBorder = '#e2e8f0';

                      if (isOverdueAlert) {
                        itemIcon = <AlertCircle size={16} color="#ef4444" />;
                        itemBg = '#fff1f2';
                        itemBorder = '#fecdd3';
                      } else if (isDeadlineAlert || isWorkloadAlert) {
                        itemIcon = <Clock size={16} color="#d97706" />;
                        itemBg = '#fffbeb';
                        itemBorder = '#fef3c7';
                      } else if (isLowProgress) {
                        itemIcon = <AlertTriangle size={16} color="#f59e0b" />;
                        itemBg = '#fffbeb';
                        itemBorder = '#fde68a';
                      } else if (isUnassigned) {
                        itemIcon = <Users size={16} color="var(--primary)" />;
                        itemBg = 'var(--bg-lavender-subtle)';
                        itemBorder = 'rgba(99, 102, 241, 0.2)';
                      }

                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: itemBg,
                            border: `1px solid ${itemBorder}`,
                            fontSize: '0.835rem',
                            fontWeight: 500,
                            color: 'var(--text-main)'
                          }}
                        >
                          <div style={{ flexShrink: 0 }}>{itemIcon}</div>
                          <span style={{ flex: 1 }}>{rec}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <span>Deterministic evaluation</span>
                  <span>Zero hallucination · 100% data backed</span>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 5. Section: Active Tasks by Member (Lightweight Bar Chart + Workload Cards) */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--primary)" />
                <CardTitle>Active Tasks by Member</CardTitle>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Non-completed tasks assigned to each collaborator
              </span>
            </CardHeader>
            <CardBody>
              {memberWorkloads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No members assigned to this project yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {memberWorkloads.map((member) => {
                    const barWidthPct =
                      maxActiveTasks > 0 ? Math.max(6, (member.activeTasks / maxActiveTasks) * 100) : 0;

                    return (
                      <div
                        key={member.userId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          flexWrap: 'wrap'
                        }}
                      >
                        {/* Member Identity */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            minWidth: '180px'
                          }}
                        >
                          <Avatar name={member.name} imageUrl={member.avatarUrl || undefined} size="sm" />
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {member.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {member.role || 'Member'}
                            </div>
                          </div>
                        </div>

                        {/* Responsive Bar Representation */}
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              marginBottom: '4px'
                            }}
                          >
                            <span>
                              {member.activeTasks} active task{member.activeTasks === 1 ? '' : 's'}
                            </span>
                            <span>{member.completedTasks} completed</span>
                          </div>
                          <div
                            style={{
                              height: '10px',
                              background: '#e2e8f0',
                              borderRadius: '9999px',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: `${barWidthPct}%`,
                                height: '100%',
                                background:
                                  member.activeTasks > 0
                                    ? 'var(--primary-gradient)'
                                    : 'transparent',
                                borderRadius: '9999px',
                                transition: 'width 0.4s ease'
                              }}
                            />
                          </div>
                        </div>

                        {/* Numerical Badge */}
                        <div style={{ textAlign: 'right', minWidth: '70px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background:
                                member.activeTasks >= 3
                                  ? '#fef3c7'
                                  : member.activeTasks > 0
                                  ? 'var(--bg-lavender-subtle)'
                                  : '#f1f5f9',
                              color:
                                member.activeTasks >= 3
                                  ? '#d97706'
                                  : member.activeTasks > 0
                                  ? 'var(--primary)'
                                  : '#94a3b8',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            {member.activeTasks} Active
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Unassigned Tasks Row if Any */}
                  {unassignedActiveTasks > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: '#fffbeb',
                        border: '1px dashed #fde68a',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          minWidth: '180px'
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '9999px',
                            background: '#fef3c7',
                            color: '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <HelpCircleIcon />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>
                            Unassigned Tasks
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#b45309' }}>
                            Needs Member Assignment
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: '160px' }}>
                        <div
                          style={{
                            height: '10px',
                            background: '#fde68a',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${(unassignedActiveTasks / maxActiveTasks) * 100}%`,
                              height: '100%',
                              background: '#d97706',
                              borderRadius: '9999px'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '70px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#fef3c7',
                            color: '#b45309',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {unassignedActiveTasks} Unassigned
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* 6. Section: Blocked Tasks & Dependencies */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="var(--primary)" />
                <CardTitle>Blocked Tasks & Dependencies</CardTitle>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 600
                }}
              >
                Dependency Engine
              </span>
            </CardHeader>
            <CardBody>
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {blockedInfo.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      The current database schema tracks status, priority, and deadlines independently.
                      All {health.totalTasks} tasks can be moved independently across the Kanban board.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                >
                  0 Blocked
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
};

// Helper icon component
const HelpCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
