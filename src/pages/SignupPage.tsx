import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Layers, Mail, Lock, User, ArrowRight, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context';
import { Button, Card, Input } from '../components/common';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, signUp, isConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = (): boolean => {
    setErrorMsg(null);
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return false;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMsg('Please enter a password.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error, data } = await signUp(email.trim(), password, fullName.trim());

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMsg('An account with this email already exists. Please log in instead.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        // If Supabase has email confirmation enabled
        if (data?.user && !data.user.identities?.length) {
          setErrorMsg('An account with this email already exists. Please log in.');
        } else if (data?.user && data.user.confirmed_at) {
          // If auto-confirmed, redirect straight to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // Email confirmation pending
          setSuccessMsg(
            `Account created successfully! A confirmation link has been sent to ${email.trim()}. Please verify your email to log in.`
          );
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred during signup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--bg-page-gradient)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box'
      }}
    >
      {/* Brand Header */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div className="brand-icon">
            <Layers size={22} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.4px' }}>
            Oquvi
          </span>
        </Link>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
          Collaborative Project Workspace
        </p>
      </div>

      <Card
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '32px',
          boxShadow: 'var(--shadow-hover)'
        }}
      >
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
          Create an account
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '22px' }}>
          Join your team in Oquvi and collaborate on projects in real time.
        </p>

        {/* Warning if Supabase is unconfigured */}
        {!isConfigured && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: '#fef3c7',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              color: '#92400e',
              fontSize: '0.825rem',
              lineHeight: 1.5,
              marginBottom: '18px'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Supabase Setup Required:</strong>
              <div style={{ marginTop: '2px' }}>
                Please set your real <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your local <code>.env</code> file.
              </div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: '#ffe4e6',
              border: '1px solid rgba(225, 29, 72, 0.25)',
              color: '#be123c',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              background: '#dcfce7',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              color: '#15803d',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              marginBottom: '18px'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Check your email!</strong>
              <div style={{ marginTop: '4px' }}>{successMsg}</div>
              <div style={{ marginTop: '10px' }}>
                <Link to="/login" style={{ color: '#15803d', fontWeight: 700, textDecoration: 'underline' }}>
                  Proceed to Login →
                </Link>
              </div>
            </div>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Full Name"
              placeholder="e.g. Aarav Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User size={16} />}
              required
              disabled={submitting}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="aarav.sharma@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
              autoComplete="email"
              disabled={submitting}
            />

            <Input
              label="Password (min 6 characters)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
              autoComplete="new-password"
              disabled={submitting}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
              autoComplete="new-password"
              disabled={submitting}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={submitting}
              icon={submitting ? undefined : <ArrowRight size={16} />}
              style={{ marginTop: '6px' }}
            >
              {submitting ? 'Creating Account...' : 'Create Oquvi Account'}
            </Button>
          </form>
        )}

        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Log in
          </Link>
        </div>
      </Card>

      {/* Return to website */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          ← Back to Oquvi Website
        </Link>
      </div>
    </div>
  );
};
