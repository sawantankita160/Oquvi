import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  AlertCircle,
  AlertTriangle,
  Edit2,
  User as UserIcon,
  X,
  Filter,
  MessageSquare,
  Activity,
  Send,
  Clock,
  Check,
  History,
  BarChart3,
  Columns3
} from 'lucide-react';
import { useAuth } from '../context';
import {
  fetchProjects,
  fetchProjectActivityLogs,
  type ProjectWithDetails
} from '../lib/projectService';
import {
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  type TaskWithAssignee
} from '../lib/taskService';
import {
  fetchTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  type TaskCommentWithAuthor
} from '../lib/commentService';
import {
  subscribeToProjectWorkspace
} from '../lib/realtimeService';
import { TeamInsights } from '../components/insights';
import { calculateProjectHealth } from '../lib/insightsService';
import type { TaskStatus, PriorityLevel } from '../types/database';
import { Card, Badge, Button, Avatar, Input } from '../components/common';

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Active view tab: 'kanban' | 'insights' (derived directly from searchParams)
  const workspaceTab = searchParams.get('view') === 'insights' ? 'insights' : 'kanban';

  // Tab switch handler
  const handleTabChange = useCallback((tab: 'kanban' | 'insights') => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'insights') {
      newParams.set('view', 'insights');
    } else {
      newParams.delete('view');
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Project state
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Task state
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals & Panels state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);
  const [activeTaskDetails, setActiveTaskDetails] = useState<TaskWithAssignee | null>(null);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  // Comments state
  const [taskComments, setTaskComments] = useState<TaskCommentWithAuthor[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<Array<{
    id: string;
    action: string;
    created_at: string;
    user: { name: string; avatarUrl?: string } | null;
  }>>([]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // Edit task form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo');
  const [editPriority, setEditPriority] = useState<PriorityLevel>('medium');
  const [editAssigneeId, setEditAssigneeId] = useState<string>('');
  const [editDeadline, setEditDeadline] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // The 3 explicit Kanban columns
  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'To Do', color: '#64748b' },
    { status: 'in_progress', title: 'In Progress', color: '#0284c7' },
    { status: 'completed', title: 'Completed', color: '#16a34a' }
  ];

  // 1. Fetch accessible projects on mount or when user changes
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
        const currentParamId = new URLSearchParams(window.location.search).get('projectId');
        const matched = projList.find((p) => p.id === currentParamId);
        const defaultProject = matched || projList.find((p) => !p.archived) || projList[0];

        setSelectedProjectId((prev) => prev || defaultProject.id);
        if (!currentParamId || currentParamId !== defaultProject.id) {
          const currentView = new URLSearchParams(window.location.search).get('view');
          const newParams: Record<string, string> = { projectId: defaultProject.id };
          if (currentView) newParams.view = currentView;
          setSearchParams(newParams, { replace: true });
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id, setSearchParams]);

  // Active selected project
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Check if current user is an authorized member or owner of the project
  const isAuthorizedMember = useMemo(() => {
    if (!currentProject || !user) return false;
    return (
      currentProject.owner_id === user.id ||
      currentProject.members.some((m) => m.user_id === user.id)
    );
  }, [currentProject, user]);

  // 2. Load tasks for selected project
  const reloadTasks = useCallback(async (projId: string, reason?: string) => {
    if (!projId) return;
    if (reason) {
      console.log(`[Oquvi Realtime] Executing reloadTasks for project ${projId} (trigger: ${reason})`);
    }
    const { data, error } = await fetchTasks(projId);
    if (error) {
      console.error(`[Oquvi Realtime] reloadTasks query failed:`, error);
      setErrorMsg(error);
    } else {
      console.log(`[Oquvi Realtime] reloadTasks succeeded. Received ${data?.length || 0} tasks for project ${projId}`);
      setTasks(data || []);
      // If task details is open, sync active task object
      setActiveTaskDetails((prev) => {
        if (!prev) return null;
        return (data || []).find((t) => t.id === prev.id) || prev;
      });
    }
  }, []);

  // 3. Load activity logs for selected project
  const reloadActivity = useCallback(async (projId: string) => {
    if (!projId) return;
    const { data } = await fetchProjectActivityLogs(projId, 30);
    if (data) {
      setActivityLogs(data);
    }
  }, []);

  // 4. Load comments for an active task
  const reloadComments = useCallback(async (taskId: string) => {
    if (!taskId) return;
    const { data, error } = await fetchTaskComments(taskId);
    if (!error && data) {
      setTaskComments(data);
    }
  }, []);

  // Stable refs for callbacks and active state to prevent subscription teardown
  const reloadTasksRef = useRef(reloadTasks);
  const reloadActivityRef = useRef(reloadActivity);
  const reloadCommentsRef = useRef(reloadComments);
  const activeTaskDetailsRef = useRef<TaskWithAssignee | null>(null);

  useEffect(() => {
    reloadTasksRef.current = reloadTasks;
    reloadActivityRef.current = reloadActivity;
    reloadCommentsRef.current = reloadComments;
    activeTaskDetailsRef.current = activeTaskDetails;
  }, [reloadTasks, reloadActivity, reloadComments, activeTaskDetails]);

  // Initial load of tasks and activity logs when selectedProjectId changes
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

    fetchProjectActivityLogs(selectedProjectId, 30).then(({ data }) => {
      if (!isMounted) return;
      if (data) {
        setActivityLogs(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  // Stable Realtime subscription for workspace changes (tasks, comments, activity)
  // Depends ONLY on selectedProjectId and authenticated user ID.
  useEffect(() => {
    if (!selectedProjectId || !user?.id) return;

    let isMounted = true;

    const unsubscribeWorkspace = subscribeToProjectWorkspace(selectedProjectId, {
      onTasksChange: (source?: string) => {
        if (!isMounted) return;
        const triggerDesc = source || 'task event';
        console.log(`[Oquvi Broadcast] Task reconciliation triggered (${triggerDesc}). Reloading tasks for project ${selectedProjectId}...`);
        reloadTasksRef.current(selectedProjectId, triggerDesc);
      },
      onActivityChange: () => {
        if (!isMounted) return;
        console.log(`[Oquvi Realtime] Activity change received. Reloading activity logs and reconciling tasks for project ${selectedProjectId}...`);
        reloadActivityRef.current(selectedProjectId);
        // Task status moves and task edits record activity_logs; reconciling tasks here ensures instant updates
        reloadTasksRef.current(selectedProjectId, 'activity log update');
      },
      onCommentsChange: () => {
        if (!isMounted) return;
        console.log(`[Oquvi Realtime] Comment change received. Reconciling tasks for project ${selectedProjectId}...`);
        reloadTasksRef.current(selectedProjectId, 'comment change');
        if (activeTaskDetailsRef.current) {
          reloadCommentsRef.current(activeTaskDetailsRef.current.id);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeWorkspace();
    };
  }, [selectedProjectId, user?.id]);

  // Load comments when activeTaskDetails is opened
  // Note: Real-time comment updates are already managed via subscribeToProjectWorkspace.
  useEffect(() => {
    const taskId = activeTaskDetails?.id;
    if (!taskId) return;

    let isMounted = true;

    fetchTaskComments(taskId).then(({ data, error }) => {
      if (!isMounted) return;
      setLoadingComments(false);
      if (error) {
        setErrorMsg(error);
      } else {
        setTaskComments(data || []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeTaskDetails?.id]);

  // Project Switcher
  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    setLoadingTasks(true);
    const newParams: Record<string, string> = { projectId: projId };
    if (workspaceTab === 'insights') {
      newParams.view = 'insights';
    }
    setSearchParams(newParams);
    // Reset filters on project switch
    setSearchQuery('');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setStatusFilter('all');
    setActiveTaskDetails(null);
  };

  // Move task to a specific column
  const handleMoveTask = async (taskId: string, targetStatus: TaskStatus) => {
    if (!isAuthorizedMember) {
      setErrorMsg('You do not have permission to modify tasks in this workspace.');
      return;
    }

    const task = tasks.find((t) => t.id === taskId);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    const { error } = await updateTaskStatus(
      taskId,
      selectedProjectId,
      targetStatus,
      user?.id,
      task?.title,
      task?.assigned_user_id
    );

    if (error) {
      setErrorMsg(`Failed to move task: ${error}`);
      reloadTasks(selectedProjectId);
    } else {
      reloadActivity(selectedProjectId);
    }
  };

  // Delete task with confirmation
  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTaskDetails?.id === taskId) {
      setActiveTaskDetails(null);
    }

    const { error } = await deleteTask(taskId, {
      projectId: selectedProjectId,
      taskTitle,
      currentUserId: user?.id
    });

    if (error) {
      setErrorMsg(`Failed to delete task: ${error}`);
      reloadTasks(selectedProjectId);
    } else {
      setSuccessMsg('Task deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      reloadTasks(selectedProjectId);
      reloadActivity(selectedProjectId);
    }
  };

  // Create new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Task title is required.');
      return;
    }
    if (!selectedProjectId) {
      setErrorMsg('Please select a project first.');
      return;
    }
    if (!isAuthorizedMember) {
      setErrorMsg('You must be a member of this project to create tasks.');
      return;
    }

    // Validate assignee belongs to the current project
    if (newAssigneeId && currentProject && !currentProject.members.some((m) => m.user_id === newAssigneeId)) {
      setErrorMsg('Invalid assignee. Tasks can only be assigned to members of this project.');
      return;
    }

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
      currentUserId: user?.id,
      projectName: currentProject?.name
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
      setSuccessMsg('Task created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      reloadTasks(selectedProjectId);
      reloadActivity(selectedProjectId);
    }
  };

  // Open Edit Task Modal
  const openEditModal = (task: TaskWithAssignee, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssigneeId(task.assigned_user_id || '');
    setEditDeadline(task.deadline ? task.deadline.substring(0, 10) : '');
  };

  // Save Edit Task
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !selectedProjectId) return;
    if (!editTitle.trim()) {
      setErrorMsg('Task title cannot be empty.');
      return;
    }

    // Validate assignee belongs to current project
    if (editAssigneeId && currentProject && !currentProject.members.some((m) => m.user_id === editAssigneeId)) {
      setErrorMsg('Invalid assignee. Tasks can only be assigned to members of this project.');
      return;
    }

    setSavingEdit(true);
    setErrorMsg(null);

    const { error } = await updateTask(
      editingTask.id,
      selectedProjectId,
      {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        status: editStatus,
        priority: editPriority,
        assignedUserId: editAssigneeId || null,
        deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
        previousAssignedUserId: editingTask.assigned_user_id
      },
      user?.id
    );

    setSavingEdit(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setEditingTask(null);
      setSuccessMsg('Task updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      reloadTasks(selectedProjectId);
      reloadActivity(selectedProjectId);
    }
  };

  // Open Task Details Modal (Comments & Details)
  const openTaskDetails = (task: TaskWithAssignee) => {
    setActiveTaskDetails(task);
    setTaskComments([]);
    setLoadingComments(true);
    setEditingCommentId(null);
    setNewCommentText('');
  };

  // Post comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskDetails || !user) return;
    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    setPostingComment(true);
    setErrorMsg(null);

    const { data, error } = await createTaskComment({
      taskId: activeTaskDetails.id,
      projectId: selectedProjectId,
      comment: trimmed,
      currentUserId: user.id,
      taskTitle: activeTaskDetails.title,
      assignedUserId: activeTaskDetails.assigned_user_id
    });

    setPostingComment(false);

    if (error) {
      setErrorMsg(`Failed to post comment: ${error}`);
    } else if (data) {
      setNewCommentText('');
      reloadComments(activeTaskDetails.id);
      reloadActivity(selectedProjectId);
      reloadTasks(selectedProjectId);
    }
  };

  // Start editing a comment
  const handleStartEditComment = (comment: TaskCommentWithAuthor) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.comment);
  };

  // Save comment edit
  const handleSaveCommentEdit = async (commentId: string) => {
    if (!activeTaskDetails || !user) return;
    const trimmed = editCommentText.trim();
    if (!trimmed) return;

    setSavingCommentEdit(true);
    const { error } = await updateTaskComment({
      commentId,
      comment: trimmed,
      currentUserId: user.id,
      projectId: selectedProjectId,
      taskTitle: activeTaskDetails.title
    });
    setSavingCommentEdit(false);

    if (error) {
      setErrorMsg(`Failed to update comment: ${error}`);
    } else {
      setEditingCommentId(null);
      setEditCommentText('');
      reloadComments(activeTaskDetails.id);
      reloadActivity(selectedProjectId);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!activeTaskDetails || !user) return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    const { error } = await deleteTaskComment({
      commentId,
      currentUserId: user.id,
      projectId: selectedProjectId,
      taskTitle: activeTaskDetails.title
    });

    if (error) {
      setErrorMsg(`Failed to delete comment: ${error}`);
    } else {
      reloadComments(activeTaskDetails.id);
      reloadActivity(selectedProjectId);
      reloadTasks(selectedProjectId);
    }
  };

  // Filter tasks strictly for the current project
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Search text filter
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // 3. Assignee filter
      if (assigneeFilter === 'unassigned') {
        if (task.assigned_user_id) return false;
      } else if (assigneeFilter !== 'all') {
        if (task.assigned_user_id !== assigneeFilter) return false;
      }

      // 4. Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter, statusFilter]);

  const hasActiveFilters =
    searchQuery !== '' ||
    priorityFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setStatusFilter('all');
  };

  // Memoized Project Health for header badge
  const projectHealth = useMemo(() => {
    return calculateProjectHealth(tasks);
  }, [tasks]);

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
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
              {workspaceTab === 'insights' ? 'Team Insights' : 'Sprint Kanban Board'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              {currentProject ? currentProject.name : 'Workspace Board'}
            </h1>

            {/* Quick Health Status Pill */}
            {currentProject && (
              <button
                type="button"
                onClick={() => handleTabChange('insights')}
                style={{
                  background: projectHealth.statusBg,
                  color: projectHealth.statusColor,
                  border: `1px solid ${projectHealth.statusColor}33`,
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'opacity var(--transition-fast)'
                }}
                title="Click to view Team Insights"
              >
                <BarChart3 size={13} />
                {projectHealth.status} ({projectHealth.completionProgress}%)
              </button>
            )}

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
            {currentProject?.description || 'Manage real tasks across To Do, In Progress, and Completed columns.'}
          </p>
        </div>

        <div className="page-actions">
          {/* Segmented View Switcher: Kanban Board vs Team Insights */}
          {currentProject && (
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: 'var(--radius-sm)',
                gap: '2px',
                marginRight: '6px'
              }}
            >
              <button
                type="button"
                onClick={() => handleTabChange('kanban')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: workspaceTab === 'kanban' ? '#ffffff' : 'transparent',
                  color: workspaceTab === 'kanban' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: workspaceTab === 'kanban' ? 'var(--shadow-xs)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Columns3 size={14} />
                Kanban
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('insights')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: workspaceTab === 'insights' ? '#ffffff' : 'transparent',
                  color: workspaceTab === 'insights' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: workspaceTab === 'insights' ? 'var(--shadow-xs)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <BarChart3 size={14} />
                Team Insights
              </button>
            </div>
          )}

          {/* Project Collaborators */}
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

          {/* Activity Feed Toggle Button */}
          {currentProject && (
            <Button
              variant={showActivityDrawer ? 'primary' : 'outline'}
              size="sm"
              icon={<Activity size={15} />}
              onClick={() => {
                setShowActivityDrawer((prev) => !prev);
                if (!showActivityDrawer) {
                  reloadActivity(selectedProjectId);
                }
              }}
              title="Toggle Project Activity History"
            >
              Activity Feed {activityLogs.length > 0 && `(${activityLogs.length})`}
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setShowNewTaskModal(true)}
            disabled={!selectedProjectId || !isAuthorizedMember}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: '#dcfce7',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            color: '#15803d',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
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

      {/* Empty State: No projects at all */}
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

      {/* Team Insights Section */}
      {projects.length > 0 && workspaceTab === 'insights' && (
        <div style={{ marginBottom: '32px' }}>
          <TeamInsights
            tasks={tasks}
            members={currentProject?.members || []}
            projectName={currentProject?.name}
            onNavigateToBoard={() => handleTabChange('kanban')}
            onAddTask={() => setShowNewTaskModal(true)}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      {projects.length > 0 && workspaceTab === 'kanban' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filters:
            </span>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'all' | PriorityLevel)}
              className="input-field"
              style={{ height: '34px', fontSize: '0.8rem', padding: '2px 8px', width: 'auto' }}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Filter (Scoped to current project members) */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="input-field"
              style={{ height: '34px', fontSize: '0.8rem', padding: '2px 8px', width: 'auto' }}
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {currentProject?.members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profile?.full_name || 'Member'}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
              className="input-field"
              style={{ height: '34px', fontSize: '0.8rem', padding: '2px 8px', width: 'auto' }}
            >
              <option value="all">All Columns</option>
              <option value="todo">To Do Only</option>
              <option value="in_progress">In Progress Only</option>
              <option value="completed">Completed Only</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={13} />}
                onClick={clearFilters}
                style={{ fontSize: '0.775rem', padding: '4px 8px' }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Search Box */}
          <div style={{ minWidth: '240px' }}>
            <Input
              icon={<Search size={15} />}
              placeholder="Search sprint tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Project Activity History Drawer */}
      {showActivityDrawer && currentProject && (
        <Card
          style={{
            marginBottom: '24px',
            padding: '20px 24px',
            background: '#ffffff',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: 'var(--shadow-md)',
            animation: 'fadeIn 200ms ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Activity History for {currentProject.name}
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: 'var(--bg-lavender-subtle)',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}
              >
                Realtime Updates Active
              </span>
            </div>

            <button
              onClick={() => setShowActivityDrawer(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Close activity feed"
            >
              <X size={16} />
            </button>
          </div>

          {activityLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No recorded activity events for this project yet.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                maxHeight: '220px',
                overflowY: 'auto',
                paddingRight: '6px'
              }}
            >
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Avatar name={log.user?.name || 'Collaborator'} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {log.action}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} />
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {log.user?.name || 'User'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 3-Column Kanban Board Grid: To Do, In Progress, Completed */}
      {projects.length > 0 && workspaceTab === 'kanban' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {columns.map((column) => {
            // Apply column match + filter criteria
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
                    disabled={!isAuthorizedMember}
                  >
                    Add
                  </Button>
                </div>

                {/* Tasks in Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loadingTasks && (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Updating sprint tasks...
                    </div>
                  )}

                  {!loadingTasks &&
                    columnTasks.map((task) => {
                      // Overdue check: deadline exists and has passed, and task is NOT completed
                      const isOverdue = Boolean(
                        task.deadline &&
                        new Date(task.deadline).getTime() < Date.now() &&
                        task.status !== 'completed'
                      );

                      return (
                        <Card
                          key={task.id}
                          onClick={() => openTaskDetails(task)}
                          style={{
                            padding: '16px',
                            background: '#ffffff',
                            boxShadow: 'var(--shadow-card)',
                            transition: 'all var(--transition-base)',
                            border: isOverdue ? '1.5px solid #f87171' : undefined,
                            cursor: 'pointer'
                          }}
                        >
                          {/* Priority Badge, Overdue Flag & Header Actions */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Badge variant={task.priority}>{task.priority}</Badge>

                              {isOverdue && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                  }}
                                  title="Task is overdue!"
                                >
                                  <AlertTriangle size={11} /> Overdue
                                </span>
                              )}
                            </div>

                            {/* Card Edit/Delete Action Icons */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={(e) => openEditModal(task, e)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '4px'
                                }}
                                title="Edit Task"
                              >
                                <Edit2 size={13} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id, task.title);
                                }}
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
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Title */}
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

                          {/* Short Description */}
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

                          {/* Due Date Indicator */}
                          {task.deadline && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.725rem',
                                color: isOverdue ? '#dc2626' : 'var(--text-dim)',
                                fontWeight: isOverdue ? 700 : 500,
                                marginBottom: '10px'
                              }}
                            >
                              <Calendar size={12} />
                              <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                          )}

                          {/* Card Footer: Assignee, Comments Counter & Action Controls */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '10px',
                              borderTop: '1px solid rgba(99, 102, 241, 0.08)',
                              marginTop: '4px'
                            }}
                          >
                            {/* Assignee & Comments Indicator */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {task.assignee ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Avatar
                                    name={task.assignee.full_name}
                                    size="sm"
                                  />
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                    {task.assignee.full_name.split(' ')[0]}
                                  </span>
                                </div>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.725rem',
                                    color: 'var(--text-dim)'
                                  }}
                                >
                                  <UserIcon size={12} /> Unassigned
                                </span>
                              )}

                              {/* Comments count indicator */}
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '0.72rem',
                                  color: 'var(--text-muted)',
                                  background: '#f8fafc',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #e2e8f0'
                                }}
                                title="Task comments"
                              >
                                <MessageSquare size={11} /> {task.commentsCount ?? 0}
                              </span>
                            </div>

                            {/* Column Transition Buttons */}
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {column.status === 'todo' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  style={{ padding: '3px 9px', fontSize: '0.75rem' }}
                                  icon={<ArrowRight size={13} />}
                                  onClick={() => handleMoveTask(task.id, 'in_progress')}
                                  title="Move to In Progress"
                                >
                                  Start
                                </Button>
                              )}

                              {column.status === 'in_progress' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                                    onClick={() => handleMoveTask(task.id, 'todo')}
                                    title="Move back to To Do"
                                  >
                                    ← To Do
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    style={{ padding: '3px 9px', fontSize: '0.75rem', background: '#059669' }}
                                    icon={<CheckCircle2 size={13} />}
                                    onClick={() => handleMoveTask(task.id, 'completed')}
                                    title="Mark as Completed"
                                  >
                                    Done
                                  </Button>
                                </>
                              )}

                              {column.status === 'completed' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                    icon={<RotateCcw size={12} />}
                                    onClick={() => handleMoveTask(task.id, 'in_progress')}
                                    title="Reopen to In Progress"
                                  >
                                    Reopen
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                                    onClick={() => handleMoveTask(task.id, 'todo')}
                                    title="Move to To Do"
                                  >
                                    To Do
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}

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

      {/* Modal: Task Details & Realtime Comments */}
      {activeTaskDetails && currentProject && (
        <div className="modal-overlay" onClick={() => setActiveTaskDetails(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92%' }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '14px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <Badge variant={activeTaskDetails.priority}>{activeTaskDetails.priority}</Badge>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--primary)',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}
                  >
                    Column: {activeTaskDetails.status === 'todo' ? 'To Do' : activeTaskDetails.status === 'in_progress' ? 'In Progress' : 'Completed'}
                  </span>
                  {activeTaskDetails.deadline && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> Due {new Date(activeTaskDetails.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.3 }}>
                  {activeTaskDetails.title}
                </h3>
              </div>

              <button
                onClick={() => setActiveTaskDetails(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Task Description & Meta Details */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                {activeTaskDetails.description || (
                  <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>No detailed description provided.</span>
                )}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assignee:</span>
                  {activeTaskDetails.assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Avatar name={activeTaskDetails.assignee.full_name} size="sm" />
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {activeTaskDetails.assignee.full_name}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-dim)' }}>Unassigned</span>
                  )}
                </div>

                {/* Edit task button shortcut */}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Edit2 size={13} />}
                  onClick={() => {
                    const taskToEdit = activeTaskDetails;
                    setActiveTaskDetails(null);
                    openEditModal(taskToEdit);
                  }}
                >
                  Edit Task
                </Button>
              </div>
            </div>

            {/* Task Comments Section */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <MessageSquare size={16} color="var(--primary)" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Task Comments ({taskComments.length})
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>• Live Discussion</span>
              </div>

              {/* Comments list */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                  marginBottom: '16px'
                }}
              >
                {loadingComments && (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    Loading comments...
                  </div>
                )}

                {!loadingComments && taskComments.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px 16px',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-dim)',
                      fontSize: '0.85rem'
                    }}
                  >
                    No comments yet. Start the conversation with your team!
                  </div>
                )}

                {!loadingComments &&
                  taskComments.map((comment) => {
                    const isAuthor = user?.id === comment.user_id;
                    const isOwner = currentProject?.owner_id === user?.id;
                    const canDelete = isAuthor || isOwner;
                    const canEdit = isAuthor;
                    const isEdited =
                      new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 2000;

                    return (
                      <div
                        key={comment.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: isAuthor ? '#fcfaff' : '#f8fafc',
                          border: isAuthor ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid #e2e8f0'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar name={comment.author?.full_name || 'Member'} size="sm" />
                            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {comment.author?.full_name || 'Collaborator'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {new Date(comment.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isEdited && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  color: 'var(--text-dim)',
                                  background: 'rgba(0,0,0,0.05)',
                                  padding: '1px 4px',
                                  borderRadius: '3px'
                                }}
                              >
                                edited
                              </span>
                            )}
                          </div>

                          {/* Action controls for author / owner */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {canEdit && editingCommentId !== comment.id && (
                              <button
                                onClick={() => handleStartEditComment(comment)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-dim)',
                                  cursor: 'pointer',
                                  padding: '2px'
                                }}
                                title="Edit your comment"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '2px'
                                }}
                                title="Delete comment"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Comment text or Inline Edit Box */}
                        {editingCommentId === comment.id ? (
                          <div style={{ marginTop: '8px' }}>
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              rows={2}
                              className="input-field"
                              style={{ width: '100%', fontSize: '0.85rem', marginBottom: '6px' }}
                              disabled={savingCommentEdit}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingCommentId(null)}
                                disabled={savingCommentEdit}
                                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<Check size={12} />}
                                onClick={() => handleSaveCommentEdit(comment.id)}
                                disabled={savingCommentEdit}
                                style={{ padding: '2px 10px', fontSize: '0.75rem' }}
                              >
                                {savingCommentEdit ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                            {comment.comment}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Write a comment or status update..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, fontSize: '0.85rem', height: '38px' }}
                  disabled={postingComment}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<Send size={13} />}
                  disabled={postingComment || !newCommentText.trim()}
                  style={{ height: '38px' }}
                >
                  {postingComment ? 'Posting...' : 'Comment'}
                </Button>
              </form>
            </div>
          </div>
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
                placeholder="e.g. Implement authentication middleware"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                autoFocus
                disabled={creatingTask}
              />

              <Input
                label="Description"
                placeholder="Details, acceptance criteria..."
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

              {/* Assignee Selection (ONLY members of current project) */}
              <div className="input-group">
                <label className="input-label">Assignee (Project Members Only)</label>
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
                      {m.profile?.full_name || 'Member'} {m.role === 'owner' ? '(Project Lead)' : ''}
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
                  {creatingTask ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Task */}
      {editingTask && currentProject && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)', fontWeight: 700 }}>
              ✏️ Edit Task
            </h3>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Task Title *"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                disabled={savingEdit}
              />

              <Input
                label="Description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={savingEdit}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Status Column</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                    className="input-field"
                    style={{ height: '42px' }}
                    disabled={savingEdit}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as PriorityLevel)}
                    className="input-field"
                    style={{ height: '42px' }}
                    disabled={savingEdit}
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Assignee Selection (ONLY members of current project) */}
              <div className="input-group">
                <label className="input-label">Assignee (Project Members Only)</label>
                <select
                  value={editAssigneeId}
                  onChange={(e) => setEditAssigneeId(e.target.value)}
                  className="input-field"
                  style={{ height: '42px' }}
                  disabled={savingEdit}
                >
                  <option value="">Unassigned</option>
                  {currentProject.members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile?.full_name || 'Member'} {m.role === 'owner' ? '(Project Lead)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Due Date"
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                disabled={savingEdit}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingTask(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Realtime collaboration banner */}
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
          <strong>Live Collaboration Active:</strong> Tasks, status updates, comments, and activity history are synchronized in real time via Supabase PostgreSQL and protected by Row Level Security.
        </div>
      </div>
    </div>
  );
};
