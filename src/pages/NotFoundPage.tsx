import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--bg-lavender-subtle)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}
      >
        <HelpCircle size={36} />
      </div>

      <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-muted)' }}>
        Workspace View Not Found
      </h2>
      <p style={{ maxWidth: '420px', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '24px' }}>
        The page or workspace view you requested doesn't exist or has been moved to another sprint.
      </p>

      <Button
        variant="primary"
        icon={<Home size={16} />}
        onClick={() => navigate('/dashboard')}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};
