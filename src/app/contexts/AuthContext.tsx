import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUsername(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();
  return data?.username ?? null;
}

function buildUser(session: Session, name: string): User {
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const username = await fetchUsername(session.user.id);
        setUser(buildUser(session, username ?? session.user.email?.split('@')[0] ?? 'User'));
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const username = await fetchUsername(session.user.id);
        setUser(buildUser(session, username ?? session.user.email?.split('@')[0] ?? 'User'));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // User state will be set by onAuthStateChange
  };

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Update profile username to the provided name
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ username: name })
        .eq('id', data.user.id);
    }
    // User state will be set by onAuthStateChange
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // User state will be cleared by onAuthStateChange
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
