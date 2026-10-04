import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layers, Mail, Lock, ArrowRight, AlertCircle, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context';
import { Button, Card, Input } from '../components/common';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signIn, resendConfirmation, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnconfirmedError, setIsUnconfirmedError] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Intended destination route or default to dashboard
  const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const validate = (): boolean => {
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrorMsg(null);
    setResendMessage(null);
    setIsUnconfirmedError(false);

    try {
      const { error, data } = await signIn(email.trim(), password);

      if (error) {
        const errorLower = (error.message || '').toLowerCase();

        if (errorLower.includes('email not confirmed')) {
          setIsUnconfirmedError(true);
          setErrorMsg(
            'This account was created when email confirmation was required, and its email address has not been confirmed in Supabase yet. You can resend the verification link below, or confirm the user in the Supabase Dashboard.'
          );
        } else if (errorLower.includes('invalid login credentials')) {
          setErrorMsg('Invalid email or password. Please verify your credentials or create a new account.');
        } else if (errorLower.includes('too many requests')) {
          setErrorMsg('Too many sign-in attempts. Please wait a moment before trying again.');
        } else {
          setErrorMsg(error.message);
        }
      } else if (data?.session || user) {
        // Successfully authenticated by Supabase! Allow user straight into app
        navigate(destination, { replace: true });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred during login.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address above to resend the confirmation email.');
      return;
    }

    setResendStatus('sending');
    setResendMessage(null);

    try {
      const { error } = await resendConfirmation(email.trim());
      if (error) {
        setResendStatus('error');
        setResendMessage(error.message);
      } else {
        setResendStatus('sent');
        setResendMessage(`Confirmation email resent to ${email.trim()}! Please check your inbox and spam folder.`);
      }
    } catch (err: unknown) {
      setResendStatus('error');
      setResendMessage(err instanceof Error ? err.message : 'Failed to resend confirmation email.');
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
          maxWidth: '440px',
          padding: '32px',
          boxShadow: 'var(--shadow-hover)'
        }}
      >
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '22px' }}>
          Log in with your email and password to access your workspace.
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
              <strong>Supabase Publishable Key Required:</strong>
              <div style={{ marginTop: '2px' }}>
                Please paste your real Supabase Project URL and Publishable API key (starts with <code>eyJ...</code> or <code>sb_publishable_...</code>) into your project's <code>.env</code> file.
              </div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: '#ffe4e6',
              border: '1px solid rgba(225, 29, 72, 0.25)',
              color: '#be123c',
              fontSize: '0.85rem',
              lineHeight: 1.45,
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>

            {isUnconfirmedError && (
              <div
                style={{
                  marginTop: '4px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(225, 29, 72, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#9f1239' }}>
                  Need a new verification link?
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={resendStatus === 'sending'}
                  onClick={handleResendConfirmation}
                  icon={resendStatus === 'sending' ? <RefreshCw size={13} /> : undefined}
                >
                  {resendStatus === 'sending' ? 'Sending link...' : 'Resend Verification Link'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Resend status feedback */}
        {resendMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: resendStatus === 'sent' ? '#ecfdf5' : '#ffe4e6',
              border: `1px solid ${resendStatus === 'sent' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(225, 29, 72, 0.25)'}`,
              color: resendStatus === 'sent' ? '#065f46' : '#be123c',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              marginBottom: '18px'
            }}
          >
            {resendStatus === 'sent' ? (
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <span>{resendMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            required
            autoComplete="current-password"
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
            {submitting ? 'Signing in...' : 'Sign In to Workspace'}
          </Button>
        </form>

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
          Don't have an account yet?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign up
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
