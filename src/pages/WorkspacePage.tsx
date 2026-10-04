import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar,
  Sparkles,
  ChevronRight,
  Search,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Trash2,
  FolderKanban,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context';
import {
  fetchProjects,
  type ProjectWithDetails
} from '../lib/projectService';
import {
  fetchTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  type TaskWithAssignee
} from '../lib/taskService';
import type { TaskStatus, PriorityLevel } from '../types/database';
import { Card, Badge, Button, Avatar, Input } from '../components/common';

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // Columns definition: To Do, In Progress, Completed
  const columns: { status: TaskStatus; title: string; color: string; badgeColor: string }[] = [
    { status: 'todo', title: 'To Do', color: '#64748b', badgeColor: '#f1f5f9' },
    { status: 'in_progress', title: 'In Progress', color: '#0284c7', badgeColor: '#e0f2fe' },
    { status: 'completed', title: 'Completed', color: '#16a34a', badgeColor: '#dcfce7' }
  ];

  // 1. Fetch accessible projects on mount
  useEffect(() => {
    let isMounted = true;

    fetchProjects().then(({ data, error }) => {
      if (!isMounted) return;
      setLoadingProjects(false);

      if (error) {
        setErrorMsg(error);
        return;
      }

      const projList = data || [];
      setProjects(projList);

      if (projList.length > 0) {
        // Priority: query param -> first active project -> first project
        const paramId = searchParams.get('projectId');
        const matched = projList.find((p) => p.id === paramId);
        const defaultProject = matched || projList.find((p) => !p.archived) || projList[0];

        setSelectedProjectId(defaultProject.id);
        if (!paramId || paramId !== defaultProject.id) {
          setSearchParams({ projectId: defaultProject.id }, { replace: true });
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [searchParams, setSearchParams]);

  // Active selected project
  const currentProject = projects.find((p) => p.id === selectedProjectId) || null;

  // 2. Load tasks when selectedProjectId changes
  const reloadTasks = useCallback(async (projId: string) => {
    if (!projId) return;
    const { data, error } = await fetchTasks(projId);
    if (error) {
      setErrorMsg(error);
    } else {
      setTasks(data || []);
    }
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    let isMounted = true;

    fetchTasks(selectedProjectId).then(({ data, error }) => {
      if (!isMounted) return;
      setLoadingTasks(false);
      if (error) {
        setErrorMsg(error);
      } else {
        setTasks(data || []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  // Project Switcher
  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    setSearchParams({ projectId: projId });
  };

  // Move task to a specific column
  const handleMoveTask = async (taskId: string, targetStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    const { error } = await updateTaskStatus(taskId, selectedProjectId, targetStatus, user?.id);
    if (error) {
      setErrorMsg(`Failed to move task: ${error}`);
      reloadTasks(selectedProjectId);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const { error } = await deleteTask(taskId);
    if (error) {
      setErrorMsg(`Failed to delete task: ${error}`);
      reloadTasks(selectedProjectId);
    }
  };

  // Create new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedProjectId) return;

    setCreatingTask(true);
    setErrorMsg(null);

    const { error } = await createTask({
      projectId: selectedProjectId,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      status: newStatus,
      priority: newPriority,
      assignedUserId: newAssigneeId || null,
      deadline: newDeadline ? new Date(newDeadline).toISOString() : null,
      currentUserId: user?.id
    });

    setCreatingTask(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setNewTitle('');
      setNewDescription('');
      setNewAssigneeId('');
      setNewDeadline('');
      setShowNewTaskModal(false);
      reloadTasks(selectedProjectId);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div>
      {/* Board Header */}
      <div className="page-header">
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginBottom: '6px'
            }}
          >
            <span>Oquvi Workspace</span>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Sprint Kanban Board</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              {currentProject ? currentProject.name : 'Workspace'}
            </h1>

            {/* Project Switcher */}
            {projects.length > 1 && (
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="input-field"
                style={{
                  height: '36px',
                  padding: '4px 10px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  background: '#ffffff'
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.archived ? '(Archived)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="page-description" style={{ marginTop: '4px' }}>
            {currentProject?.description || 'Organize and track tasks across To Do, In Progress, and Completed.'}
          </p>
        </div>

        <div className="page-actions">
          {/* Real Collaborators on this Project */}
          {currentProject && currentProject.members.length > 0 && (
            <div className="avatar-group" style={{ marginRight: '8px' }}>
              {currentProject.members.map((m) => (
                <Avatar
                  key={m.id}
                  name={m.profile?.full_name || 'Member'}
                  size="sm"
                />
              ))}
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setShowNewTaskModal(true)}
            disabled={!selectedProjectId}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: '#ffe4e6',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            color: '#be123c',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* When no projects exist */}
      {!loadingProjects && projects.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '54px 24px' }}>
          <FolderKanban size={48} color="var(--primary)" style={{ opacity: 0.7, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
            No workspace projects yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 20px auto' }}>
            Create a project first to start adding and organizing sprint tasks on your Kanban board.
          </p>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/projects')}>
            Create Your First Project
          </Button>
        </Card>
      )}

      {/* Filter and Search Bar */}
      {projects.length > 0 && (
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Priority:
            </span>
            {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((pri) => (
              <Button
                key={pri}
                size="sm"
                variant={priorityFilter === pri ? 'primary' : 'outline'}
                onClick={() => setPriorityFilter(pri)}
              >
                {pri.charAt(0).toUpperCase() + pri.slice(1)}
              </Button>
            ))}
          </div>

          <div style={{ minWidth: '280px' }}>
            <Input
              icon={<Search size={16} />}
              placeholder="Search sprint tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* 3-Column Kanban Board Grid */}
      {projects.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.status);

            return (
              <div
                key={column.status}
                style={{
                  background: '#f9f8fe',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  minHeight: '520px'
                }}
              >
                {/* Column Title & Counter */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(99, 102, 241, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: column.color
                      }}
                    />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      {column.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#ffffff',
                        color: column.color,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: '1px solid rgba(99, 102, 241, 0.1)'
                      }}
                    >
                      {columnTasks.length}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      setNewStatus(column.status);
                      setShowNewTaskModal(true);
                    }}
                    title={`Add task to ${column.title}`}
                  >
                    Add
                  </Button>
                </div>

                {/* Tasks in Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loadingTasks && (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Updating tasks...
                    </div>
                  )}

                  {!loadingTasks &&
                    columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        style={{
                          padding: '16px',
                          background: '#ffffff',
                          boxShadow: 'var(--shadow-card)',
                          transition: 'all var(--transition-base)'
                        }}
                      >
                        {/* Priority Badge */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px'
                          }}
                        >
                          <Badge variant={task.priority}>{task.priority}</Badge>
                          {task.deadline && (
                            <span
                              style={{
                                fontSize: '0.725rem',
                                color: 'var(--text-dim)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Calendar size={12} />
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h4
                          style={{
                            fontSize: '0.925rem',
                            fontWeight: 600,
                            margin: '0 0 6px 0',
                            lineHeight: 1.4,
                            color: 'var(--text-main)'
                          }}
                        >
                          {task.title}
                        </h4>

                        {task.description && (
                          <p
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              margin: '0 0 12px 0',
                              lineHeight: 1.5
                            }}
                          >
                            {task.description}
                          </p>
                        )}

                        {/* Card Footer: Assignee & Action Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(99, 102, 241, 0.08)',
                            marginTop: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {task.assignee ? (
                              <Avatar
                                name={task.assignee.full_name}
                                size="sm"
                              />
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                Unassigned
                              </span>
                            )}
                          </div>

                          {/* Column Transition Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {column.status === 'todo' && (
                              <Button
                                variant="primary"
                                size="sm"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                icon={<ArrowRight size={13} />}
                                onClick={() => handleMoveTask(task.id, 'in_progress')}
                                title="Start Task"
                              >
                                Start
                              </Button>
                            )}

                            {column.status === 'in_progress' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                  onClick={() => handleMoveTask(task.id, 'todo')}
                                  title="Move back to To Do"
                                >
                                  ← Back
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#059669' }}
                                  icon={<CheckCircle2 size={13} />}
                                  onClick={() => handleMoveTask(task.id, 'completed')}
                                  title="Mark as Done"
                                >
                                  Done
                                </Button>
                              </>
                            )}

                            {column.status === 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                icon={<RotateCcw size={13} />}
                                onClick={() => handleMoveTask(task.id, 'in_progress')}
                                title="Reopen task"
                              >
                                Reopen
                              </Button>
                            )}

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                              title="Delete task"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}

                  {!loadingTasks && columnTasks.length === 0 && (
                    <div
                      style={{
                        padding: '32px 16px',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        color: 'var(--text-dim)',
                        border: '2px dashed rgba(99, 102, 241, 0.15)',
                        borderRadius: 'var(--radius-md)',
                        background: '#ffffff'
                      }}
                    >
                      No tasks in {column.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create New Task */}
      {showNewTaskModal && currentProject && (
        <div className="modal-overlay" onClick={() => setShowNewTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)', fontWeight: 700 }}>
              ⚡ Add Task to {currentProject.name}
            </h3>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Task Title *"
                placeholder="e.g. Implement Supabase database queries"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                autoFocus
                disabled={creatingTask}
              />

              <Input
                label="Description"
                placeholder="Optional details, acceptance criteria..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                disabled={creatingTask}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Initial Column</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                    className="input-field"
                    style={{ height: '42px' }}
                    disabled={creatingTask}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="input-field"
                    style={{ height: '42px' }}
                    disabled={creatingTask}
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Assignee selection from project members */}
              <div className="input-group">
                <label className="input-label">Assignee</label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="input-field"
                  style={{ height: '42px' }}
                  disabled={creatingTask}
                >
                  <option value="">Unassigned</option>
                  {currentProject.members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile?.full_name || 'Member'} {m.role === 'owner' ? '(Owner)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Due Date (Optional)"
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                disabled={creatingTask}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewTaskModal(false)}
                  disabled={creatingTask}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={creatingTask}>
                  {creatingTask ? 'Adding...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Telemetry info banner */}
      <div
        style={{
          marginTop: '32px',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: '#ffffff',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.875rem'
        }}
      >
        <Sparkles size={20} color="var(--primary)" />
        <div>
          <strong>Supabase PostgreSQL Realtime Ready:</strong> All task moves, additions, and updates are saved directly
          to the <code>tasks</code> table and logged to <code>activity_logs</code> with strict Row Level Security.
        </div>
      </div>
    </div>
  );
};
