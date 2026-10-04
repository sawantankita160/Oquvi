import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Archive,
  ArrowRight,
  Clock,
  Sparkles,
  Plus,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context';
import {
  fetchProjects,
  fetchActivityLogs,
  type ProjectWithDetails
} from '../lib/projectService';
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
  Avatar
} from '../components/common';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [activities, setActivities] = useState<
    Array<{
      id: string;
      action: string;
      created_at: string;
      user: { name: string; avatarUrl?: string } | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchProjects(), fetchActivityLogs(6)]).then(
      ([projectsRes, activitiesRes]) => {
        if (!isMounted) return;
        setProjects(projectsRes.data || []);
        setActivities(activitiesRes.data || []);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute stats from real Supabase data
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => !p.archived).length;
  const archivedProjects = projects.filter((p) => p.archived).length;

  // Unique team members across user's projects
  const uniqueMemberIds = new Set<string>();
  projects.forEach((p) => {
    p.members.forEach((m) => uniqueMemberIds.add(m.user_id));
  });
  const totalCollaborators = uniqueMemberIds.size || 1;

  // Display user's first name
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Collaborator';
  const firstName = displayName.split(' ')[0];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {firstName} 👋
          </h1>
          <p className="page-description">
            Here is your live team sprint telemetry and active workspace overview.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => navigate('/projects')}
          >
            New Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<BarChart3 size={15} />}
            onClick={() => navigate('/workspace?view=insights')}
          >
            Team Insights
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles size={16} />}
            onClick={() => navigate('/workspace')}
          >
            Open Kanban Board
          </Button>
        </div>
      </div>

      {/* KPI Stats Row (Backed by real Supabase data) */}
      <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
        <StatCard
          label="Total Projects"
          value={loading ? '-' : totalProjects}
          change={activeProjects > 0 ? `${activeProjects} active now` : 'Ready to start'}
          isPositive={activeProjects > 0}
          icon={<FolderKanban size={22} />}
        />
        <StatCard
          label="Active Workspaces"
          value={loading ? '-' : activeProjects}
          change={archivedProjects > 0 ? `${archivedProjects} archived` : 'All workspaces active'}
          isPositive={true}
          icon={<CheckSquare size={22} />}
        />
        <StatCard
          label="Archived Projects"
          value={loading ? '-' : archivedProjects}
          change="Available in history"
          isPositive={false}
          icon={<Archive size={22} />}
        />
        <StatCard
          label="Team Collaborators"
          value={loading ? '-' : totalCollaborators}
          change="Across projects"
          isPositive={true}
          icon={<Users size={22} />}
        />
      </div>

      {/* Two Column Section: Active Projects & Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Left Column: Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Projects</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowRight size={14} />}
              onClick={() => navigate('/projects')}
            >
              View All
            </Button>
          </CardHeader>
          <CardBody>
            {loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading projects...
              </div>
            )}

            {!loading && projects.length === 0 && (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  background: 'var(--bg-lavender-subtle)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <FolderKanban size={36} color="var(--primary)" style={{ opacity: 0.6, marginBottom: '10px' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  No projects in your workspace yet
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Create your first collaborative project workspace to start tracking deliverables.
                </p>
                <Button size="sm" variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/projects')}>
                  Create Project
                </Button>
              </div>
            )}

            {!loading && projects.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {projects.slice(0, 4).map((project) => (
                  <div
                    key={project.id}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'var(--bg-surface-hover)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                    onClick={() => navigate(`/workspace?projectId=${project.id}`)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {project.name}
                      </span>
                      <Badge variant={project.archived ? 'planning' : 'active'}>
                        {project.archived ? 'Archived' : 'Active'}
                      </Badge>
                    </div>

                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                      {project.description || 'No description provided.'}
                    </p>

                    {/* Progress Bar */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginBottom: '6px'
                        }}
                      >
                        <span>
                          {project.tasksCount.completed}/{project.tasksCount.total} tasks completed
                        </span>
                        <strong style={{ color: 'var(--primary)' }}>{project.progress}%</strong>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'var(--bg-lavender-subtle)',
                          borderRadius: '999px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${project.progress}%`,
                            height: '100%',
                            background: 'var(--primary-gradient)',
                            borderRadius: '999px'
                          }}
                        />
                      </div>
                    </div>

                    {/* Card Footer: Members & Team Insights shortcut */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workspace?projectId=${project.id}&view=insights`);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                        title="View Team Insights telemetry for this project"
                      >
                        <BarChart3 size={12} />
                        Team Insights →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right Column: Recent Workspace Activity & Quick Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                Live Stream
              </span>
            </CardHeader>
            <CardBody>
              {loading && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading activity stream...
                </div>
              )}

              {!loading && activities.length === 0 && (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No recent activity logged yet. Workspace operations and task changes will stream here.
                </div>
              )}

              {!loading && activities.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <Avatar name={act.user?.name || 'Collaborator'} size="sm" />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, color: 'var(--text-main)' }}>
                          <strong>{act.user?.name || 'Workspace User'}</strong> {act.action}
                        </p>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                            marginTop: '3px'
                          }}
                        >
                          <Clock size={12} />
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          {new Date(act.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick Kanban Action Card */}
          <Card
            style={{
              background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
              borderColor: 'rgba(99, 102, 241, 0.25)'
            }}
          >
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <FolderKanban size={20} />
              Sprint Kanban Board
            </CardTitle>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-body)',
                margin: '8px 0 16px 0',
                lineHeight: 1.5
              }}
            >
              Organize sprint tasks across <strong>To Do</strong>, <strong>In Progress</strong>, and <strong>Completed</strong>.
              All task updates persist in real time using Supabase PostgreSQL.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight size={14} />}
              onClick={() => navigate('/workspace')}
            >
              Open Kanban Board
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
