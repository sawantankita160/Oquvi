import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Sparkles,
  ChevronRight,
  Search,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { MOCK_TASKS, MOCK_USERS } from '../data/mockData';
import type { Task, TaskStatus, PriorityLevel } from '../types';
import { Card, Badge, Button, Avatar, Input } from '../components/common';

export const WorkspacePage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [newTag, setNewTag] = useState('Feature');

  // The 3 explicit columns requested: To Do, In Progress, Completed
  const columns: { status: TaskStatus; title: string; color: string; badgeColor: string }[] = [
    { status: 'todo', title: 'To Do', color: '#64748b', badgeColor: '#f1f5f9' },
    { status: 'in_progress', title: 'In Progress', color: '#0284c7', badgeColor: '#e0f2fe' },
    { status: 'completed', title: 'Completed', color: '#16a34a', badgeColor: '#dcfce7' }
  ];

  // Move task to a specific column
  const handleMoveTask = (taskId: string, targetStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Create new task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: 'proj-1',
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      status: newStatus,
      priority: newPriority,
      assignee: MOCK_USERS[0],
      dueDate: 'Oct 14',
      tags: [newTag]
    };

    setTasks([...tasks, newTask]);
    setNewTitle('');
    setNewDescription('');
    setShowNewTaskModal(false);
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
              marginBottom: '4px'
            }}
          >
            <span>TeamFlow Workspace</span>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Sprint Kanban Board</span>
          </div>
          <h1 className="page-title">Sprint Kanban Board</h1>
          <p className="page-description">
            Organize tasks across To Do, In Progress, and Completed. Click buttons to move cards smoothly.
          </p>
        </div>

        <div className="page-actions">
          {/* Active Collaborators on this Board */}
          <div className="avatar-group" style={{ marginRight: '8px' }}>
            {MOCK_USERS.map((user) => (
              <Avatar
                key={user.id}
                name={user.name}
                size="sm"
                status={user.status}
                showStatus
              />
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setShowNewTaskModal(true)}
          >
            Add Task
          </Button>
        </div>
      </div>

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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Filter Priority:
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
            placeholder="Search tasks or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Modal: Create New Task */}
      {showNewTaskModal && (
        <div className="modal-overlay" onClick={() => setShowNewTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>
              ⚡ Add Task to Kanban Board
            </h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Task Title"
                placeholder="e.g. Implement drag & drop reordering"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />

              <Input
                label="Description"
                placeholder="Optional details, acceptance criteria..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Initial Column</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                    className="input-field"
                    style={{ height: '42px' }}
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
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Tag</label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="input-field"
                    style={{ height: '42px' }}
                  >
                    <option value="Feature">Feature</option>
                    <option value="Design">Design</option>
                    <option value="Backend">Backend</option>
                    <option value="Bug">Bug</option>
                    <option value="Demo">Demo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewTaskModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-Column Kanban Board Grid: To Do, In Progress, Completed */}
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
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    style={{
                      padding: '16px',
                      background: '#ffffff',
                      boxShadow: 'var(--shadow-card)',
                      transition: 'all var(--transition-base)'
                    }}
                  >
                    {/* Tags & Priority */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '0.7rem',
                              background: 'var(--bg-lavender-subtle)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              color: 'var(--primary)',
                              fontWeight: 600
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <Badge variant={task.priority}>{task.priority}</Badge>
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

                    {/* Card Footer: Assignee, Due, & Interactive Column Shifter */}
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
                        {task.assignee && (
                          <Avatar
                            name={task.assignee.name}
                            size="sm"
                            status={task.assignee.status}
                            showStatus
                          />
                        )}
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Calendar size={12} />
                          {task.dueDate}
                        </span>
                      </div>

                      {/* Interactive Column Transition Buttons */}
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
                              title="Mark as Completed"
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

                {columnTasks.length === 0 && (
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

      {/* Real-time Collaboration Tip */}
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
          <strong>Kanban Flow:</strong> You can move tasks between <strong>To Do</strong>,{' '}
          <strong>In Progress</strong>, and <strong>Completed</strong> using the action buttons on each card.
          All updates reflect across the dashboard and sprint telemetry in real time.
        </div>
      </div>
    </div>
  );
};
