import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

export interface UserPermissions {
  role: 'admin' | 'user';
  can_read_token_wallet: boolean;
  can_edit_token_wallet: boolean;
  can_read_payments: boolean;
  can_edit_payments: boolean;
  can_read_app_wallet: boolean;
  can_edit_app_wallet: boolean;
}

const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  role: 'user',
  can_read_token_wallet: false,
  can_edit_token_wallet: false,
  can_read_payments: false,
  can_edit_payments: false,
  can_read_app_wallet: true,
  can_edit_app_wallet: false,
};

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  permissions: UserPermissions | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const ADMIN_EMAIL = 'hoang.hoa@gmail.com';

  async function loadPermissions(userId: string, email: string) {
    const isAdminEmail = email === ADMIN_EMAIL;

    // Admin permissions used as fallback and as default row value
    const adminPerms: UserPermissions = {
      role: 'admin',
      can_read_token_wallet: true,
      can_edit_token_wallet: true,
      can_read_payments: true,
      can_edit_payments: true,
      can_read_app_wallet: true,
      can_edit_app_wallet: true,
    };

    const defaultRow = {
      user_id: userId,
      email,
      role: isAdminEmail ? 'admin' : 'user',
      can_read_token_wallet: isAdminEmail,
      can_edit_token_wallet: isAdminEmail,
      can_read_payments: isAdminEmail,
      can_edit_payments: isAdminEmail,
      can_read_app_wallet: true,
      can_edit_app_wallet: isAdminEmail,
    };

    // Try to upsert (may fail if table missing or RLS blocks — that's ok)
    try {
      await supabase
        .from('tkw_user_permissions')
        .upsert(defaultRow, { onConflict: 'user_id', ignoreDuplicates: true });
    } catch (_) { /* silent */ }

    // Try to read from DB
    const { data } = await supabase
      .from('tkw_user_permissions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setPermissions({
        role: data.role,
        can_read_token_wallet: data.can_read_token_wallet,
        can_edit_token_wallet: data.can_edit_token_wallet,
        can_read_payments: data.can_read_payments,
        can_edit_payments: data.can_edit_payments,
        can_read_app_wallet: data.can_read_app_wallet,
        can_edit_app_wallet: data.can_edit_app_wallet,
      });
    } else if (isAdminEmail) {
      // Fallback: DB unavailable but this IS the admin email → grant full access
      setPermissions(adminPerms);
    } else {
      setPermissions(DEFAULT_USER_PERMISSIONS);
    }
  }

  async function refreshPermissions() {
    if (session?.user) {
      await loadPermissions(session.user.id, session.user.email ?? '');
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadPermissions(s.user.id, s.user.email ?? '').finally(() =>
          setIsAuthLoading(false)
        );
      } else {
        setIsAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        loadPermissions(s.user.id, s.user.email ?? '');
      } else {
        setPermissions(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setPermissions(null);
  }

  const user = session?.user ?? null;
  const isAdmin = permissions?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      session, user, permissions, isAdmin, isAuthLoading,
      signInWithGoogle, signOut, refreshPermissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
