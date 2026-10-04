import React, { useState } from 'react';
import { UserPlus, Mail, Shield, Circle, MessageSquare, Search } from 'lucide-react';
import { MOCK_USERS } from '../data/mockData';
import type { User } from '../types';
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Badge,
  Input
} from '../components/common';

export const TeamPage: React.FC = () => {
  const [members, setMembers] = useState<User[]>(MOCK_USERS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDept, setInviteDept] = useState('Engineering');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember: User = {
      id: `user-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: 'Member',
      status: 'online',
      department: inviteDept
    };

    setMembers([...members, newMember]);
    setInviteName('');
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const onlineCount = members.filter((m) => m.status === 'online').length;

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      deptFilter === 'All' || (m.department && m.department.includes(deptFilter));
    return matchesSearch && matchesDept;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Members</h1>
          <p className="page-description">
            Collaborate with engineers, designers, and sprint leads across active workspaces.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => setShowInviteModal(true)}
          >
            Invite Member
          </Button>
        </div>
      </div>

      {/* Online presence summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: '#ffffff',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.875rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Circle size={10} fill="#10b981" color="#10b981" />
            <strong style={{ color: 'var(--text-main)' }}>{onlineCount}</strong> Online now
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Circle size={10} fill="#94a3b8" color="#94a3b8" />
            <strong style={{ color: 'var(--text-main)' }}>
              {members.length - onlineCount}
            </strong>{' '}
            Away / Offline
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['All', 'Engineering', 'Design', 'Product', 'AI'].map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              style={{
                background: deptFilter === dept ? 'var(--primary-light)' : 'transparent',
                color: deptFilter === dept ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div style={{ maxWidth: '360px', marginBottom: '24px' }}>
        <Input
          icon={<Search size={16} />}
          placeholder="Search teammates by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Modal: Invite Member */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>
              💌 Invite New Team Member
            </h3>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Full Name"
                placeholder="e.g. Jordan Lee"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="priya@oquvi.dev"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />

              <div className="input-group">
                <label className="input-label">Department</label>
                <select
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  className="input-field"
                  style={{ height: '42px' }}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="AI Research">AI Research</option>
                  <option value="DevOps">DevOps</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Cards Grid */}
      <div className="grid-cols-3">
        {filteredMembers.map((member) => (
          <Card key={member.id}>
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <Avatar
                  name={member.name}
                  size="lg"
                  status={member.status}
                  showStatus
                />
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>
                    {member.name}
                  </h3>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    {member.department || 'Workspace Member'}
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
                  <Mail size={14} color="var(--primary)" />
                  <span>{member.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={14} color="var(--primary)" />
                  <span>
                    Role: <strong style={{ color: 'var(--text-main)' }}>{member.role}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Badge variant={member.status === 'online' ? 'active' : 'planning'}>
                  {member.status}
                </Badge>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<MessageSquare size={14} />}
                  onClick={() => alert(`Direct message window placeholder for ${member.name}`)}
                >
                  Message
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
