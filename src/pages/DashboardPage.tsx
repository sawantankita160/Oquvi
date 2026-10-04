import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  Plus
} from 'lucide-react';
import {
  MOCK_STATS,
  MOCK_PROJECTS,
  MOCK_ACTIVITIES,
  CURRENT_USER
} from '../data/mockData';
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

  const renderStatIcon = (name: string) => {
    switch (name) {
      case 'FolderKanban':
        return <FolderKanban size={22} />;
      case 'CheckSquare':
        return <CheckSquare size={22} />;
      case 'Users':
        return <Users size={22} />;
      case 'Zap':
        return <Zap size={22} />;
      default:
        return <FolderKanban size={22} />;
    }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {CURRENT_USER.name.split(' ')[0]} 👋
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
            variant="primary"
            size="sm"
            icon={<Sparkles size={16} />}
            onClick={() => navigate('/workspace')}
          >
            Open Kanban Board
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
        {MOCK_STATS.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            isPositive={stat.isPositive}
            icon={renderStatIcon(stat.iconName)}
          />
        ))}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {MOCK_PROJECTS.slice(0, 3).map((project) => (
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
                  onClick={() => navigate('/workspace')}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {project.title}
                    </span>
                    <Badge variant={project.status}>{project.status.replace('_', ' ')}</Badge>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                    {project.description}
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
                      <span>Progress</span>
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
                </div>
              ))}
            </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {MOCK_ACTIVITIES.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <Avatar name={act.user.name} size="sm" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: 'var(--text-main)' }}>
                        <strong>{act.user.name}</strong> {act.action}{' '}
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {act.target}
                        </span>
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
                        {act.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
              <Zap size={20} />
              Sprint Kanban Board Active
            </CardTitle>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-body)',
                margin: '8px 0 16px 0',
                lineHeight: 1.5
              }}
            >
              Cards are synchronized across <strong>To Do</strong>, <strong>In Progress</strong>, and <strong>Completed</strong>.
              Advance tasks or create new sprint deliverables directly on the board.
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
