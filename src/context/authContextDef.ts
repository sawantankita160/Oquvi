import { createContext } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; data?: { user: User | null; session: Session | null } }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null; data?: { user: User | null; session: Session | null } }>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
