import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Search, Users, AlertCircle, CheckCircle2, Crown } from 'lucide-react';
import { useAuth } from '../context';
import {
  fetchProjects,
  fetchProfiles,
  addProjectMember,
  type ProjectWithDetails,
  type DbProfile
} from '../lib/projectService';
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Badge,
  Input
} from '../components/common';

export const TeamPage: React.FC = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchProjects(), fetchProfiles()]).then(([projRes, profRes]) => {
      if (!isMounted) return;
      setLoading(false);

      if (projRes.error) setErrorMsg(projRes.error);
      else setProjects(projRes.data || []);

      if (profRes.error) setErrorMsg(profRes.error);
      else setProfiles(profRes.data || []);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute unique teammates from accessible projects
  const teamMembersMap = new Map<
    string,
    {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      isOwner: boolean;
      projectNames: string[];
    }
  >();

  // Add all profiles to directory
  profiles.forEach((p) => {
    teamMembersMap.set(p.id, {
      id: p.id,
      fullName: p.full_name || 'Registered User',
      avatarUrl: p.avatar_url,
      isOwner: false,
      projectNames: []
    });
  });

  // Populate projects and ownership
  projects.forEach((proj) => {
    proj.members.forEach((m) => {
      const existing = teamMembersMap.get(m.user_id);
      if (existing) {
        if (!existing.projectNames.includes(proj.name)) {
          existing.projectNames.push(proj.name);
        }
        if (m.role === 'owner' || proj.owner_id === m.user_id) {
          existing.isOwner = true;
        }
      } else {
        teamMembersMap.set(m.user_id, {
          id: m.user_id,
          fullName: m.profile?.full_name || 'Member',
          avatarUrl: m.profile?.avatar_url,
          isOwner: m.role === 'owner',
          projectNames: [proj.name]
        });
      }
    });
  });

  const allMembers = Array.from(teamMembersMap.values());

  const filteredMembers = allMembers.filter((m) =>
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter projects owned by the current user for inviting
  const ownedProjects = projects.filter((p) => p.owner_id === user?.id && !p.archived);

  // Handle member invitation to a workspace
  const handleInviteToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedUserId) return;

    setSubmittingInvite(true);
    setErrorMsg(null);

    const { error } = await addProjectMember(
      selectedProjectId,
      selectedUserId,
      'member',
      user?.id
    );

    setSubmittingInvite(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setShowInviteModal(false);
      setSelectedUserId('');
      setSelectedProjectId('');
      setSuccessMsg('Member added to project successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);

      // Refresh projects
      const updated = await fetchProjects();
      if (updated.data) setProjects(updated.data);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Directory</h1>
          <p className="page-description">
            Collaborators and workspace members registered in your Oquvi organization.
          </p>
        </div>

        <div className="page-actions">
          {ownedProjects.length > 0 && (
            <Button
              variant="primary"
              icon={<UserPlus size={16} />}
              onClick={() => {
                setSelectedProjectId(ownedProjects[0].id);
                setShowInviteModal(true);
              }}
            >
              Add to Workspace
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
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

      {/* Search Input */}
      <div style={{ maxWidth: '360px', marginBottom: '24px' }}>
        <Input
          icon={<Search size={16} />}
          placeholder="Search teammates by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Loading team directory from Supabase...
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && filteredMembers.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Users size={40} color="var(--primary)" style={{ opacity: 0.6, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-main)' }}>
            No teammates found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Registered users who sign up in Oquvi will appear in this directory.
          </p>
        </Card>
      )}

      {/* Member Cards Grid */}
      {!loading && filteredMembers.length > 0 && (
        <div className="grid-cols-3">
          {filteredMembers.map((member) => {
            const isCurrentUser = member.id === user?.id;

            return (
              <Card key={member.id}>
                <CardBody>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <Avatar
                      name={member.fullName}
                      size="lg"
                    />
                    <div>
                      <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)', fontWeight: 600 }}>
                        {member.fullName} {isCurrentUser ? '(You)' : ''}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {member.isOwner ? 'Workspace Lead' : 'Collaborator'}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '12px 14px',
                      background: 'var(--bg-lavender-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      color: 'var(--text-body)',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={14} color="var(--primary)" />
                      <span>
                        Role: <strong style={{ color: 'var(--text-main)' }}>{member.isOwner ? 'Project Owner' : 'Team Member'}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Users size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        Projects:{' '}
                        <strong>
                          {member.projectNames.length > 0
                            ? member.projectNames.join(', ')
                            : 'No active projects yet'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {member.isOwner ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px'
                        }}
                      >
                        <Crown size={12} /> Project Owner
                      </span>
                    ) : (
                      <Badge variant="planning">Member</Badge>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Add to Workspace */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', color: 'var(--text-main)', fontWeight: 700 }}>
              👥 Add Teammate to Workspace
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Select a project and a registered user to add them as an active project collaborator.
            </p>

            <form onSubmit={handleInviteToProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Select Workspace (Owned by you) *</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="input-field"
                  style={{ height: '42px' }}
                  required
                  disabled={submittingInvite}
                >
                  {ownedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Select Registered User *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="input-field"
                  style={{ height: '42px' }}
                  required
                  disabled={submittingInvite}
                >
                  <option value="">Choose a user...</option>
                  {profiles
                    .filter((p) => p.id !== user?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.id.substring(0, 8)}...)
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowInviteModal(false)}
                  disabled={submittingInvite}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!selectedProjectId || !selectedUserId || submittingInvite}
                >
                  {submittingInvite ? 'Adding...' : 'Add to Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
