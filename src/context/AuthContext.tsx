import React, { useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthContext } from './authContextDef';

/**
 * Oquvi - Authentication Provider Component
 * 
 * Synchronizes with real Supabase Auth session, managing sign in,
 * sign up, sign out, and token renewals.
 */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    // 1. Fetch the active session on mount
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.error('Error fetching initial Supabase session:', error.message);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // 2. Subscribe to auth changes (sign in, sign out, token refresh, expired session)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real Supabase sign in
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: {
          name: 'ConfigurationError',
          message: 'Supabase credentials are not configured yet in your local .env file.'
        } as AuthError
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return {
      error,
      data: {
        user: data?.user ?? null,
        session: data?.session ?? null
      }
    };
  };

  // Real Supabase sign up with optional full_name metadata
  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: {
          name: 'ConfigurationError',
          message: 'Supabase credentials are not configured yet in your local .env file.'
        } as AuthError
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || ''
        }
      }
    });

    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return {
      error,
      data: {
        user: data?.user ?? null,
        session: data?.session ?? null
      }
    };
  };

  // Resend email confirmation if account was created under an email confirmation policy
  const resendConfirmation = async (email: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: {
          name: 'ConfigurationError',
          message: 'Supabase credentials are not configured.'
        } as AuthError
      };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    });

    return { error };
  };

  // Real Supabase sign out
  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resendConfirmation
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
