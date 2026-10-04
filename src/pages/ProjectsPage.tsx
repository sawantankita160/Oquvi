import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { MOCK_PROJECTS, MOCK_USERS } from '../data/mockData';
import type { Project, ProjectStatus } from '../types';
import {
  Card,
  CardBody,
  Badge,
  Button,
  Avatar,
  Input
} from '../components/common';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New project form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<Project['category']>('Frontend');

  // Filter logic
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || 'No description provided.',
      status: 'planning',
      priority: 'medium',
      progress: 0,
      memberIds: ['user-1'],
      dueDate: 'TBD',
      category: newCategory,
      tasksCount: { total: 0, completed: 0 }
    };

    setProjects([newProject, ...projects]);
    setNewTitle('');
    setNewDescription('');
    setShowCreateModal(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-description">
            Track collaborative hackathon workspaces and deliverable milestones.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Modal: Create New Project */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>
              🚀 Create a New Workspace Project
            </h3>
            <form
              onSubmit={handleCreateProject}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <Input
                label="Project Title"
                placeholder="e.g. Real-Time Chat & Video Sync"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />

              <div className="input-group">
                <label className="input-label">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as Project['category'])
                  }
                  className="input-field"
                  style={{ height: '42px' }}
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Design">Design</option>
                  <option value="AI / ML">AI / ML</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Hackathon">Hackathon</option>
                </select>
              </div>

              <Input
                label="Short Description"
                placeholder="What is this workspace building?"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Add to Workspace
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['all', 'in_progress', 'planning', 'completed'] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? 'primary' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all'
                ? 'All Projects'
                : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Button>
          ))}
        </div>

        <div style={{ minWidth: '280px' }}>
          <Input
            icon={<Search size={16} />}
            placeholder="Search projects by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '14px' }}>
            No projects matched your criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="grid-cols-2">
          {filteredProjects.map((project) => (
            <Card key={project.id} interactive onClick={() => navigate('/workspace')}>
              <CardBody>
                {/* Header row with category & priority */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {project.category.toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Badge variant={project.priority}>{project.priority}</Badge>
                    <Badge variant={project.status}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-main)' }}>
                  {project.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginBottom: '20px',
                    minHeight: '40px',
                    lineHeight: 1.5
                  }}
                >
                  {project.description}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.775rem',
                      color: 'var(--text-muted)',
                      marginBottom: '6px'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} color="var(--primary)" />
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

                {/* Footer: Due date, Collaborators, & View CTA */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-card)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.775rem',
                      color: 'var(--text-dim)'
                    }}
                  >
                    <Calendar size={14} />
                    <span>Due {project.dueDate}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar-group">
                      {project.memberIds.map((id) => {
                        const member = MOCK_USERS.find((u) => u.id === id);
                        return member ? (
                          <Avatar
                            key={member.id}
                            name={member.name}
                            size="sm"
                          />
                        ) : null;
                      })}
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
