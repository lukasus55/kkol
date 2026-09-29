'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UserContextType {
  user: any;
  loading: boolean;
  fetchUser: () => Promise<void>;
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (val: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminModeState] = useState<boolean>(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.role === 'admin') {
          const stored = typeof window !== 'undefined' ? localStorage.getItem('kkol_admin_mode') : null;
          setIsAdminModeState(stored === 'true');
        } else {
          setIsAdminModeState(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('kkol_admin_mode');
          }
        }
      } else {
        router.push('/login?r=dashboard');
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      router.push('/login?r=dashboard');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const setAdminMode = useCallback(
    (val: boolean) => {
      if (user?.role !== 'admin') {
        setIsAdminModeState(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kkol_admin_mode');
        }
        return;
      }
      setIsAdminModeState(val);
      if (typeof window !== 'undefined') {
        localStorage.setItem('kkol_admin_mode', String(val));
        if (!val && window.location.pathname.startsWith('/dashboard/admin')) {
          router.push('/dashboard/summary');
        }
      }
    },
    [user, router]
  );

  const toggleAdminMode = useCallback(() => {
    if (user?.role !== 'admin') return;
    setIsAdminModeState((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kkol_admin_mode', String(next));
        if (!next && window.location.pathname.startsWith('/dashboard/admin')) {
          router.push('/dashboard/summary');
        }
      }
      return next;
    });
  }, [user, router]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        fetchUser,
        isAdminMode,
        toggleAdminMode,
        setAdminMode,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
