import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Archive,
  RotateCcw,
  Trash2,
  Edit2,
  Users,
  ShieldCheck,
  AlertCircle,
  FolderKanban,
  UserPlus,
  Crown
} from 'lucide-react';
import { useAuth } from '../context';
import {
  fetchProjects,
  createProject,
  updateProject,
  toggleArchiveProject,
  deleteProject,
  fetchProfiles,
  addProjectMember,
  removeProjectMember,
  type ProjectWithDetails,
  type DbProfile
} from '../lib/projectService';
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
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'archived' | 'owned'>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithDetails | null>(null);
  const [managingMembersProject, setManagingMembersProject] = useState<ProjectWithDetails | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  // Members management state
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberActionMsg, setMemberActionMsg] = useState<string | null>(null);

  // Reload projects after mutations
  const reloadProjects = useCallback(async () => {
    const { data, error } = await fetchProjects();
    if (error) {
      setErrorMsg(error);
    } else {
      setProjects(data || []);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    let isMounted = true;

    fetchProjects().then(({ data, error }) => {
      if (!isMounted) return;
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        setProjects(data || []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load registered profiles for member invitation
  useEffect(() => {
    if (managingMembersProject) {
      fetchProfiles().then(({ data }) => {
        setProfiles(data || []);
      });
    }
  }, [managingMembersProject]);

  // Handle Project Creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a project name.');
      return;
    }
    if (!user) {
      setErrorMsg('You must be logged in to create a project.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      userId: user.id
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setName('');
      setDescription('');
      setDeadline('');
      setShowCreateModal(false);
      setSuccessMsg('Project created successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      await reloadProjects();
    }
  };

  // Open Edit Modal
  const openEditModal = (project: ProjectWithDetails) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description || '');
    setEditDeadline(project.deadline ? project.deadline.substring(0, 10) : '');
  };

  // Handle Edit Submit
  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editName.trim()) {
      setErrorMsg('Project name cannot be empty.');
      return;
    }

    setSubmitting(true);
    const { error } = await updateProject(editingProject.id, {
      name: editName.trim(),
      description: editDescription.trim() || null,
      deadline: editDeadline ? new Date(editDeadline).toISOString() : null
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setEditingProject(null);
      setSuccessMsg('Project updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await reloadProjects();
    }
  };

  // Handle Archive / Restore Toggle
  const handleToggleArchive = async (project: ProjectWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    const actionLabel = project.archived ? 'restoring' : 'archiving';
    const { error } = await toggleArchiveProject(project.id, project.archived, user?.id);
    if (error) {
      setErrorMsg(`Error ${actionLabel} project: ${error}`);
    } else {
      setSuccessMsg(`Project ${project.archived ? 'restored' : 'archived'} successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await reloadProjects();
    }
  };

  // Handle Delete Project
  const handleDelete = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await deleteProject(projectId);
    if (error) {
      setErrorMsg(`Failed to delete project: ${error}`);
    } else {
      setSuccessMsg('Project deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await reloadProjects();
    }
  };

  // Handle Add Member to Project
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingMembersProject || !selectedUserId) return;

    setAddingMember(true);
    setMemberActionMsg(null);

    const { error } = await addProjectMember(
      managingMembersProject.id,
      selectedUserId,
      'member',
      user?.id
    );

    setAddingMember(false);

    if (error) {
      setMemberActionMsg(`Error: ${error}`);
    } else {
      setSelectedUserId('');
      setMemberActionMsg('Member added successfully!');
      // Reload project details
      const updated = await fetchProjects();
      if (updated.data) {
        setProjects(updated.data);
        const refreshedCurrent = updated.data.find((p) => p.id === managingMembersProject.id);
        if (refreshedCurrent) {
          setManagingMembersProject(refreshedCurrent);
        }
      }
    }
  };

  // Handle Remove Member from Project
  const handleRemoveMember = async (targetUserId: string) => {
    if (!managingMembersProject) return;
    if (!window.confirm('Remove this member from the project?')) return;

    const { error } = await removeProjectMember(
      managingMembersProject.id,
      targetUserId,
      user?.id
    );

    if (error) {
      setMemberActionMsg(`Error: ${error}`);
    } else {
      setMemberActionMsg('Member removed.');
      const updated = await fetchProjects();
      if (updated.data) {
        setProjects(updated.data);
        const refreshedCurrent = updated.data.find((p) => p.id === managingMembersProject.id);
        if (refreshedCurrent) {
          setManagingMembersProject(refreshedCurrent);
        }
      }
    }
  };

  // Filtering Logic
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'active') return !project.archived;
    if (filterTab === 'archived') return project.archived;
    if (filterTab === 'owned') return project.owner_id === user?.id;

    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-description">
            Create, collaborate on, and manage team workspaces backed by real Supabase PostgreSQL.
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

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: '#dcfce7',
            border: '1px solid rgba(22, 163, 74, 0.25)',
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
          <Button
            size="sm"
            variant={filterTab === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilterTab('all')}
          >
            All ({projects.length})
          </Button>
          <Button
            size="sm"
            variant={filterTab === 'active' ? 'primary' : 'outline'}
            onClick={() => setFilterTab('active')}
          >
            Active ({projects.filter((p) => !p.archived).length})
          </Button>
          <Button
            size="sm"
            variant={filterTab === 'archived' ? 'primary' : 'outline'}
            onClick={() => setFilterTab('archived')}
          >
            Archived ({projects.filter((p) => p.archived).length})
          </Button>
          <Button
            size="sm"
            variant={filterTab === 'owned' ? 'primary' : 'outline'}
            onClick={() => setFilterTab('owned')}
          >
            My Projects ({projects.filter((p) => p.owner_id === user?.id).length})
          </Button>
        </div>

        <div style={{ minWidth: '280px' }}>
          <Input
            icon={<Search size={16} />}
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem' }}>
            Loading projects from Supabase...
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '54px 24px' }}>
          <FolderKanban size={48} color="var(--primary)" style={{ opacity: 0.7, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
            {projects.length === 0 ? 'No projects in your workspace yet' : 'No matching projects found'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 20px auto' }}>
            {projects.length === 0
              ? 'Get started by creating your first collaborative project workspace. You will be assigned as the project owner.'
              : 'Try clearing your search query or switching filter tabs to see your other projects.'}
          </p>
          {projects.length === 0 ? (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              Create First Project
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterTab('all');
              }}
            >
              Reset Filters
            </Button>
          )}
        </Card>
      )}

      {/* Projects Grid */}
      {!loading && filteredProjects.length > 0 && (
        <div className="grid-cols-2">
          {filteredProjects.map((project) => {
            const isOwner = project.owner_id === user?.id;

            return (
              <Card
                key={project.id}
                interactive
                onClick={() => navigate(`/workspace?projectId=${project.id}`)}
                style={{
                  opacity: project.archived ? 0.75 : 1,
                  border: project.archived ? '1px dashed var(--border-card)' : undefined
                }}
              >
                <CardBody>
                  {/* Top row: Status, Ownership, & Action Controls */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {isOwner ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            border: '1px solid rgba(217, 119, 6, 0.2)'
                          }}
                        >
                          <Crown size={12} /> Owner
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'var(--bg-lavender-subtle)',
                            color: 'var(--primary)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '999px'
                          }}
                        >
                          <ShieldCheck size={12} /> Member
                        </span>
                      )}

                      {project.archived ? (
                        <Badge variant="planning">Archived</Badge>
                      ) : (
                        <Badge variant="active">Active</Badge>
                      )}
                    </div>

                    {/* Owner Action Buttons */}
                    <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setManagingMembersProject(project);
                        }}
                        title="Manage Team Members"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px'
                        }}
                      >
                        <Users size={15} />
                      </button>

                      {isOwner && (
                        <>
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(project);
                            }}
                            title="Edit Project Details"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px'
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            className="btn-icon"
                            onClick={(e) => handleToggleArchive(project, e)}
                            title={project.archived ? 'Restore Project' : 'Archive Project'}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: project.archived ? '#059669' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px'
                            }}
                          >
                            {project.archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                          </button>

                          <button
                            className="btn-icon"
                            onClick={(e) => handleDelete(project.id, project.name, e)}
                            title="Delete Project"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 700 }}>
                    {project.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      marginBottom: '18px',
                      minHeight: '38px',
                      lineHeight: 1.5
                    }}
                  >
                    {project.description || 'No description provided.'}
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
                        {project.tasksCount.completed}/{project.tasksCount.total} sprint tasks
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

                  {/* Footer: Date, Collaborators, & View CTA */}
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
                      <span>
                        {project.deadline
                          ? `Due ${new Date(project.deadline).toLocaleDateString()}`
                          : `Created ${new Date(project.created_at).toLocaleDateString()}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar-group">
                        {project.members.slice(0, 3).map((m) => (
                          <Avatar
                            key={m.id}
                            name={m.profile?.full_name || 'Member'}
                            size="sm"
                          />
                        ))}
                        {project.members.length > 3 && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              marginLeft: '4px'
                            }}
                          >
                            +{project.members.length - 3}
                          </span>
                        )}
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
            );
          })}
        </div>
      )}

      {/* Modal: Create Project */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', color: 'var(--text-main)', fontWeight: 700 }}>
              🚀 Create a New Project Workspace
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              You will automatically become the owner of this project and can invite collaborators.
            </p>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Project Name *"
                placeholder="e.g. CampusConnect Portal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                disabled={submitting}
              />

              <Input
                label="Description"
                placeholder="Brief summary of goals and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />

              <Input
                label="Target Deadline (Optional)"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={submitting}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Project */}
      {editingProject && (
        <div className="modal-overlay" onClick={() => setEditingProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', color: 'var(--text-main)', fontWeight: 700 }}>
              ✏️ Edit Project Details
            </h3>

            <form onSubmit={handleEditProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Project Name *"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={submitting}
              />

              <Input
                label="Description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={submitting}
              />

              <Input
                label="Target Deadline"
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                disabled={submitting}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingProject(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Project Members */}
      {managingMembersProject && (
        <div className="modal-overlay" onClick={() => setManagingMembersProject(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>
                👥 Project Members
              </h3>
              <Badge variant="planning">{managingMembersProject.name}</Badge>
            </div>

            {memberActionMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: memberActionMsg.startsWith('Error') ? '#ffe4e6' : '#dcfce7',
                  color: memberActionMsg.startsWith('Error') ? '#be123c' : '#15803d',
                  fontSize: '0.825rem',
                  marginBottom: '14px'
                }}
              >
                {memberActionMsg}
              </div>
            )}

            {/* List of current members */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '220px', overflowY: 'auto' }}>
              {managingMembersProject.members.map((m) => {
                const isProjectOwner = m.role === 'owner';
                const isCurrentUserOwner = managingMembersProject.owner_id === user?.id;

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-lavender-subtle)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={m.profile?.full_name || 'Member'} size="sm" />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {m.profile?.full_name || 'Registered User'}
                        </div>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {isProjectOwner ? '👑 Project Owner' : 'Collaborator'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant={isProjectOwner ? 'active' : 'planning'}>
                        {m.role}
                      </Badge>

                      {isCurrentUserOwner && !isProjectOwner && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                          title="Remove member from project"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Member Form (Only if current user is owner) */}
            {managingMembersProject.owner_id === user?.id ? (
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '16px',
                  marginTop: '10px'
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-main)' }}>
                  Add Registered Member
                </h4>

                <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="input-field"
                      style={{ height: '42px', width: '100%' }}
                      disabled={addingMember}
                    >
                      <option value="">Select a registered user...</option>
                      {profiles
                        .filter((p) => !managingMembersProject.members.some((m) => m.user_id === p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} ({p.id.substring(0, 8)}...)
                          </option>
                        ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!selectedUserId || addingMember}
                    icon={<UserPlus size={15} />}
                  >
                    {addingMember ? 'Adding...' : 'Add'}
                  </Button>
                </form>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '10px' }}>
                Only the project owner can add or remove members.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="ghost" onClick={() => setManagingMembersProject(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
