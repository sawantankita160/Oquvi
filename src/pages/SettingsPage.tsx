import React, { useState } from 'react';
import { Save, Bell, Shield, Sliders, Check, UserCheck } from 'lucide-react';
import { Card, CardBody, Button, Input } from '../components/common';
import { CURRENT_USER } from '../data/mockData';

export const SettingsPage: React.FC = () => {
  // Profile state
  const [userName, setUserName] = useState(CURRENT_USER.name);
  const [userEmail, setUserEmail] = useState(CURRENT_USER.email);
  const [department, setDepartment] = useState(CURRENT_USER.department || 'Core Engineering');

  // Workspace state
  const [workspaceName, setWorkspaceName] = useState('Hackathon Team Alpha');
  const [slug, setSlug] = useState('oquvi-alpha');

  // Notification toggles
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifyTaskUpdates, setNotifyTaskUpdates] = useState(true);
  const [notifyDailyDigest, setNotifyDailyDigest] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspace Settings</h1>
          <p className="page-description">
            Manage your personal profile, team workspace identity, and alert preferences.
          </p>
        </div>

        <div className="page-actions">
          {savedSuccess && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#16a34a',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: '#dcfce7',
                padding: '6px 12px',
                borderRadius: '8px'
              }}
            >
              <Check size={16} /> Preferences saved successfully!
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Personal Profile */}
        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <UserCheck size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>User Profile</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <Input
                label="Full Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <Input
                label="Email Address"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>

            <Input
              label="Department / Role"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </CardBody>
        </Card>

        {/* Workspace Identity */}
        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Sliders size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>Workspace Identity</h3>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Workspace Display Name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                helperText="Visible to all team members and shared links."
              />

              <Input
                label="Workspace Slug / URL"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                helperText="oquvi.dev/workspace/your-slug"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <Button variant="primary" type="submit" icon={<Save size={16} />}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Notifications & Collaboration */}
        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Bell size={20} color="#0284c7" />
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>Alerts & Preferences</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Direct Mentions & Assignments
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Receive in-app popups whenever someone assigns you a task or mentions your name.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyMentions}
                  onChange={(e) => setNotifyMentions(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Kanban Card Status Shifts
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Notify me when cards move to "In Progress" or "Completed" in our sprint.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyTaskUpdates}
                  onChange={(e) => setNotifyTaskUpdates(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '8px 0'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Daily Standup Digest
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Summary of completed tasks, blockers, and velocity at 9:00 AM.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDailyDigest}
                  onChange={(e) => setNotifyDailyDigest(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }}
                />
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Developer Integration Note */}
        <Card
          style={{
            background: 'var(--bg-lavender-subtle)',
            border: '1px dashed rgba(99, 102, 241, 0.3)'
          }}
        >
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Shield size={18} color="var(--primary)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Persistent Database Ready
              </h4>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Settings and sprint boards are stored in responsive React memory state.
              Ready for smooth connection to Supabase, Firebase, or a custom Express/PostgreSQL backend whenever your hackathon team decides!
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
