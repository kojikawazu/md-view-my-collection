'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_COOKIE_NAME, ESPRESSO_THEME } from '@/constants';
import { DesignSystem, MutationResult, ReportItem, User } from '@/types';
import { supabase } from '@/lib/supabaseClient';

interface AppState {
  theme: DesignSystem;
  reports: ReportItem[];
  tags: string[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  currentUser: User | null;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  loginWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  addReport: (report: Omit<ReportItem, 'id'>) => Promise<MutationResult>;
  updateReport: (id: string, updatedData: Partial<ReportItem>) => Promise<MutationResult>;
  deleteReport: (id: string) => Promise<MutationResult>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const theme = ESPRESSO_THEME;
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'supabase';
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE ?? 'supabase';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const setAuthFlagCookie = (isAuthenticated: boolean) => {
    if (typeof document === 'undefined') return;
    if (isAuthenticated) {
      document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; Max-Age=604800; SameSite=Lax`;
      return;
    }
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  };

  const checkAllowedEmail = async ({
    email,
    accessToken: token,
  }: {
    email?: string | null;
    accessToken?: string | null;
  }) => {
    try {
      if (authMode === 'local') {
        const response = await fetch('/api/auth/is-allowed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email ?? null }),
        });
        if (!response.ok) return false;
        const result = (await response.json()) as { allowed?: boolean };
        return Boolean(result.allowed);
      }

      if (!token) return false;
      const response = await fetch('/api/auth/admin', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return false;
      const result = (await response.json()) as { isAdmin?: boolean };
      return Boolean(result.isAdmin);
    } catch (error) {
      console.error('[auth] admin check failed', error);
      return false;
    }
  };

  const deriveTagsFromReports = (items: ReportItem[]) =>
    Array.from(new Set(items.flatMap((report) => report.tags ?? []).filter(Boolean)));

  const fetchReports = async () => {
    if (dataMode === 'local') {
      const savedReports = localStorage.getItem('espresso_reports');
      if (savedReports) {
        try {
          const parsedReports = JSON.parse(savedReports) as ReportItem[];
          setReports(parsedReports);
          setTags(deriveTagsFromReports(parsedReports));
          return;
        } catch {
          setReports([]);
          setTags([]);
          return;
        }
      }
      setReports([]);
      setTags([]);
      return;
    }

    try {
      const res = await fetch('/api/reports');
      if (!res.ok) {
        console.error('[reports] fetch failed', res.status);
        setReports([]);
        return;
      }
      const data = (await res.json()) as ReportItem[];
      setReports(data);
    } catch (error) {
      console.error('[reports] fetch failed', error);
      setReports([]);
    }
  };

  const fetchTags = async () => {
    if (dataMode === 'local') {
      const savedReports = localStorage.getItem('espresso_reports');
      if (savedReports) {
        try {
          const parsedReports = JSON.parse(savedReports) as ReportItem[];
          setTags(deriveTagsFromReports(parsedReports));
          return;
        } catch {
          setTags([]);
          return;
        }
      }
      setTags([]);
      return;
    }

    try {
      const res = await fetch('/api/tags');
      if (!res.ok) {
        console.error('[tags] fetch failed', res.status);
        setTags([]);
        return;
      }
      const data = (await res.json()) as string[];
      setTags(data);
    } catch (error) {
      console.error('[tags] fetch failed', error);
      setTags([]);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (authMode === 'local') {
        const savedUser = localStorage.getItem('espresso_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser) as User | null;
            const allowed = await checkAllowedEmail({ email: parsedUser?.email });
            if (parsedUser?.email && !allowed) {
              localStorage.setItem('espresso_user', JSON.stringify(null));
              setCurrentUser(null);
            } else {
              const normalizedUser = parsedUser
                ? {
                    ...parsedUser,
                    username: 'Manager',
                  }
                : null;
              setCurrentUser(normalizedUser);
              localStorage.setItem('espresso_user', JSON.stringify(normalizedUser));
            }
          } catch {
            setCurrentUser(null);
          }
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      const sessionUser = session?.user ?? null;
      if (sessionUser) {
        const allowed = await checkAllowedEmail({
          email: sessionUser.email,
          accessToken: session?.access_token,
        });
        if (!allowed) {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setAccessToken(null);
          router.push('/login?error=unauthorized');
          return;
        }
        setCurrentUser({
          id: sessionUser.id,
          username: 'Manager',
          email: sessionUser.email ?? undefined,
          role: 'admin',
        });
        setAccessToken(session?.access_token ?? null);
      } else {
        setCurrentUser(null);
        setAccessToken(null);
      }
    };

    const init = async () => {
      await Promise.all([fetchReports(), fetchTags(), initAuth()]);
      setIsHydrated(true);
    };

    void init();
  }, []);

  useEffect(() => {
    if (dataMode === 'local') {
      localStorage.setItem('espresso_reports', JSON.stringify(reports));
      setTags(deriveTagsFromReports(reports));
    }
  }, [reports, dataMode]);

  useEffect(() => {
    if (authMode === 'local') {
      if (!isHydrated) return;
      localStorage.setItem('espresso_user', JSON.stringify(currentUser));
    }
  }, [currentUser, authMode, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setAuthFlagCookie(Boolean(currentUser));
  }, [currentUser, isHydrated]);

  useEffect(() => {
    if (authMode === 'local') return;
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        const sessionUser = session?.user ?? null;
        if (!sessionUser) {
          setCurrentUser(null);
          setAccessToken(null);
          return;
        }
        const allowed = await checkAllowedEmail({
          email: sessionUser.email,
          accessToken: session?.access_token,
        });
        if (!allowed) {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setAccessToken(null);
          router.push('/login?error=unauthorized');
          return;
        }
        setCurrentUser({
          id: sessionUser.id,
          username: 'Manager',
          email: sessionUser.email ?? undefined,
          role: 'admin',
        });
        setAccessToken(session?.access_token ?? null);
      })();
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (authMode === 'local') {
      const user = { id: '1', username: 'Manager', email, role: 'admin' as const };
      const allowed = await checkAllowedEmail({ email: user.email });
      if (!allowed) {
        return '許可されていないメールアドレスです。';
      }
      console.info('[auth] login', { userId: user.id, username: user.username });
      localStorage.setItem('espresso_user', JSON.stringify(user));
      setCurrentUser(user);
      setAuthFlagCookie(true);
      router.push('/');
      return null;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    const sessionUser = data.user;
    if (sessionUser) {
      const allowed = await checkAllowedEmail({
        email: sessionUser.email,
        accessToken: data.session?.access_token,
      });
      if (!allowed) {
        await supabase.auth.signOut();
        return '許可されていないメールアドレスです。';
      }
      console.info('[auth] login', { userId: sessionUser.id, username: sessionUser.email });
      setCurrentUser({
        id: sessionUser.id,
        username: 'Manager',
        email: sessionUser.email ?? undefined,
        role: 'admin',
      });
      setAccessToken(data.session?.access_token ?? null);
      setAuthFlagCookie(true);
    }
    router.push('/');
    return null;
  };

  const loginWithGoogle = async () => {
    if (authMode === 'local') {
      return null;
    }
    const redirectTo =
      siteUrl ?? (typeof window === 'undefined' ? undefined : `${window.location.origin}/`);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) return error.message;
    console.info('[auth] login', { provider: 'google' });
    return null;
  };

  const logout = async () => {
    console.info('[auth] logout');
    if (authMode === 'local') {
      localStorage.setItem('espresso_user', JSON.stringify(null));
      setCurrentUser(null);
      setAccessToken(null);
      setAuthFlagCookie(false);
      router.push('/login');
      return;
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
    setAccessToken(null);
    setAuthFlagCookie(false);
    router.push('/login');
  };

  const addReport = async (report: Omit<ReportItem, 'id'>): Promise<MutationResult> => {
    if (dataMode === 'local') {
      const newReport = { ...report, id: Date.now().toString() };
      console.info('[reports] create', { reportId: newReport.id, title: newReport.title });
      setReports((prev) => {
        const nextReports = [newReport, ...prev];
        setTags(deriveTagsFromReports(nextReports));
        return nextReports;
      });
      router.push('/');
      return { ok: true };
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(report),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          ok: false,
          status: res.status,
          error: body.error ?? 'Create failed',
          fieldErrors: body.errors,
        };
      }

      const created = (await res.json()) as ReportItem;
      console.info('[reports] create', { reportId: created.id, title: created.title });
      setReports((prev) => [created, ...prev]);
      void fetchTags();
      router.push('/');
      return { ok: true };
    } catch (error) {
      console.error('[reports] create failed', error);
      return { ok: false, status: 500, error: 'Network error' };
    }
  };

  const updateReport = async (
    id: string,
    updatedData: Partial<ReportItem>,
  ): Promise<MutationResult> => {
    if (dataMode === 'local') {
      console.info('[reports] update', { reportId: id });
      setReports((prev) => {
        const nextReports = prev.map((report) =>
          report.id === id ? { ...report, ...updatedData } : report,
        );
        setTags(deriveTagsFromReports(nextReports));
        return nextReports;
      });
      router.push(`/report/${id}`);
      return { ok: true };
    }

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          ok: false,
          status: res.status,
          error: body.error ?? 'Update failed',
          fieldErrors: body.errors,
        };
      }

      const updated = (await res.json()) as ReportItem;
      console.info('[reports] update', { reportId: id });
      setReports((prev) => prev.map((report) => (report.id === id ? updated : report)));
      void fetchTags();
      router.push(`/report/${id}`);
      return { ok: true };
    } catch (error) {
      console.error('[reports] update failed', error);
      return { ok: false, status: 500, error: 'Network error' };
    }
  };

  const deleteReport = async (id: string): Promise<MutationResult> => {
    if (dataMode === 'local') {
      console.info('[reports] delete', { reportId: id });
      setReports((prev) => {
        const nextReports = prev.filter((report) => report.id !== id);
        setTags(deriveTagsFromReports(nextReports));
        return nextReports;
      });
      router.push('/');
      return { ok: true };
    }

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          ok: false,
          status: res.status,
          error: body.error ?? 'Delete failed',
        };
      }

      console.info('[reports] delete', { reportId: id });
      setReports((prev) => prev.filter((report) => report.id !== id));
      void fetchTags();
      router.push('/');
      return { ok: true };
    } catch (error) {
      console.error('[reports] delete failed', error);
      return { ok: false, status: 500, error: 'Network error' };
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        theme,
        reports,
        tags,
        selectedCategory,
        setSelectedCategory,
        selectedTag,
        setSelectedTag,
        currentUser,
        isHydrated,
        login,
        loginWithGoogle,
        logout,
        addReport,
        updateReport,
        deleteReport,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};
