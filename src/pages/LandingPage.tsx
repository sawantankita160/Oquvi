import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  Columns3,
  Users,
  Zap,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Kanban,
  Activity
} from 'lucide-react';
import { Button, Card, Badge } from '../components/common';
import { MOCK_TASKS, MOCK_USERS } from '../data/mockData';
import { useAuth } from '../context';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'board' | 'presence' | 'metrics'>('board');

  return (
    <div className="landing-shell">
      {/* Top Marketing Navigation */}
      <header className="landing-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" className="brand-logo">
            <div className="brand-icon">
              <Layers size={20} />
            </div>
            <span>Oquvi</span>
          </Link>

          <nav style={{ display: 'flex', gap: '20px' }}>
            <a href="#features" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              Features
            </a>
            <a href="#preview" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              Interactive Demo
            </a>
            <a href="#workflow" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              Workflow
            </a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight size={15} />}
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Log In
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight size={15} />}
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <Sparkles size={15} color="var(--primary)" />
          <span>Next-Gen Collaborative Workspace • Built for Hackathons</span>
        </div>

        <h1 className="hero-headline">
          Where fast-moving teams <span>plan, build & ship</span> together.
        </h1>

        <p className="hero-subtitle">
          Supercharge your team sprints with real-time Kanban boards, active workspace telemetry,
          collaborative member presence, and a calm soft-lavender SaaS interface.
        </p>

        <div className="hero-cta-group">
          <Button
            variant="primary"
            size="lg"
            icon={<Zap size={18} />}
            onClick={() => navigate('/dashboard')}
          >
            Launch Free Workspace
          </Button>

          <Button
            variant="secondary"
            size="lg"
            icon={<Columns3 size={18} />}
            onClick={() => navigate('/workspace')}
          >
            Try Kanban Board
          </Button>
        </div>

        {/* Interactive Workspace Mockup Frame */}
        <div id="preview" className="hero-preview-frame">
          {/* Top Bar of preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Oquvi Live Workspace — Sprint #1
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {(['board', 'presence', 'metrics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: activeTab === tab ? 'var(--primary-light)' : 'transparent',
                    color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab === 'board' ? 'Kanban View' : tab === 'presence' ? 'Team Presence' : 'Telemetry'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive tab content */}
          {activeTab === 'board' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                textAlign: 'left'
              }}
            >
              {[
                { title: 'To Do', color: '#64748b', count: 2 },
                { title: 'In Progress', color: '#0284c7', count: 2 },
                { title: 'Completed', color: '#16a34a', count: 2 }
              ].map((col) => (
                <div
                  key={col.title}
                  style={{
                    background: '#f8f6fe',
                    borderRadius: '12px',
                    padding: '12px',
                    border: '1px solid rgba(99, 102, 241, 0.08)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.825rem', color: col.color }}>
                      ● {col.title}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#ffffff', padding: '2px 6px', borderRadius: '999px' }}>
                      {col.count}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {MOCK_TASKS.filter((t) =>
                      col.title === 'To Do'
                        ? t.status === 'todo'
                        : col.title === 'In Progress'
                        ? t.status === 'in_progress'
                        : t.status === 'completed'
                    )
                      .slice(0, 1)
                      .map((task) => (
                        <div
                          key={task.id}
                          style={{
                            background: '#ffffff',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.06)',
                            border: '1px solid rgba(99, 102, 241, 0.06)'
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {task.title}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            <Badge variant={task.priority}>{task.priority}</Badge>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{task.dueDate}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'presence' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', textAlign: 'left' }}>
              {MOCK_USERS.map((user) => (
                <div
                  key={user.id}
                  style={{
                    background: '#f8f6fe',
                    padding: '12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary-gradient)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}
                  >
                    {user.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {user.department} • <strong style={{ color: user.status === 'online' ? '#16a34a' : '#d97706' }}>{user.status}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', textAlign: 'left' }}>
              <div style={{ background: '#f8f6fe', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sprint Completion</span>
                <h3 style={{ fontSize: '1.6rem', margin: '4px 0 0 0', color: 'var(--primary)' }}>92%</h3>
                <span style={{ fontSize: '0.72rem', color: '#16a34a' }}>+14% faster pace</span>
              </div>
              <div style={{ background: '#f8f6fe', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Realtime Sync</span>
                <h3 style={{ fontSize: '1.6rem', margin: '4px 0 0 0', color: '#0284c7' }}>12ms</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>WebSocket latency</span>
              </div>
              <div style={{ background: '#f8f6fe', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active Collaborators</span>
                <h3 style={{ fontSize: '1.6rem', margin: '4px 0 0 0', color: '#7c3aed' }}>5 / 5</h3>
                <span style={{ fontSize: '0.72rem', color: '#16a34a' }}>Full sprint attendance</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronRight size={14} />}
              onClick={() => navigate('/workspace')}
            >
              Open Full Interactive Board Experience
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Value Pillars Section */}
      <section id="features" style={{ maxWidth: '1200px', margin: '0 auto 80px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '10px' }}>
            Designed for high-speed hackathons & ambitious teams
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
            Everything you need to move from brainstorming to polished demo in record time.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <Card>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--bg-lavender-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <Kanban size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Kanban Workflow</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              To Do, In Progress, and Completed columns. Shift card statuses with one click or drag them effortlessly.
            </p>
          </Card>

          <Card>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Team Presence</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Know exactly who is online, busy with focus work, or away. Keep everyone synchronized across time zones.
            </p>
          </Card>

          <Card>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <Activity size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Sprint Telemetry</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Instant metric cards calculate completion velocities, pending deadlines, and real-time activity feeds.
            </p>
          </Card>

          <Card>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>White & Soft Lavender</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Clean, calm typography with rounded cards that avoid eye fatigue during late-night coding sessions.
            </p>
          </Card>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section
        id="workflow"
        style={{
          maxWidth: '1100px',
          margin: '0 auto 80px auto',
          padding: '0 24px'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            borderRadius: '24px',
            padding: '48px 36px',
            color: '#ffffff',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)'
          }}
        >
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '14px', color: '#ffffff' }}>
            Ready to experience Oquvi?
          </h2>
          <p
            style={{
              fontSize: '1.1rem',
              maxWidth: '600px',
              margin: '0 auto 28px auto',
              opacity: 0.9,
              lineHeight: 1.6
            }}
          >
            Launch the collaborative workspace now to test projects, move cards on the Kanban board, and invite team members.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="lg"
              style={{ background: '#ffffff', color: '#4f46e5', borderColor: '#ffffff', fontWeight: 700 }}
              onClick={() => navigate('/dashboard')}
            >
              Open Dashboard Now
            </Button>
            <Button
              variant="secondary"
              size="lg"
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
              onClick={() => navigate('/workspace')}
            >
              Go to Kanban Board
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '36px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <Layers size={18} color="var(--primary)" />
          <strong style={{ color: 'var(--text-main)' }}>Oquvi Workspace</strong>
          <span>• Built for high-velocity teams</span>
        </div>
        <p style={{ margin: 0 }}>
          Crafted with React, TypeScript & Vite.
        </p>
      </footer>
    </div>
  );
};
