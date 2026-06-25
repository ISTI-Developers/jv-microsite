'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { User } from '@/app/(protected)/users/users.type';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const session = localStorage.getItem('session');

    if (!session) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'GET',
        router,
        cache: 'no-store',
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setUser(data);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('session');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [router]);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setIsLoading(false);
    })();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        router,
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('session');
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/login');
    }
  }, [router]);
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
