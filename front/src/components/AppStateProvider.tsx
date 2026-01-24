'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ESPRESSO_THEME, INITIAL_REPORTS } from '../constants';
import { DesignSystem, ReportItem, User } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AppState {
  theme: DesignSystem;
  reports: ReportItem[];
  currentUser: User | null;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  addReport: (report: Omit<ReportItem, 'id'>) => void;
  updateReport: (id: string, updatedData: Partial<ReportItem>) => void;
  deleteReport: (id: string) => void;
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
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const theme = ESPRESSO_THEME;
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'supabase';

  useEffect(() => {
    const init = async () => {
      const savedReports = localStorage.getItem('espresso_reports');
      if (savedReports) {
        try {
          setReports(JSON.parse(savedReports));
        } catch {
          setReports(INITIAL_REPORTS);
        }
      }

      if (authMode === 'local') {
        const savedUser = localStorage.getItem('espresso_user');
        if (savedUser) {
          try {
            setCurrentUser(JSON.parse(savedUser));
          } catch {
            setCurrentUser(null);
          }
        }
        setIsHydrated(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      setCurrentUser(
        sessionUser
          ? {
              id: sessionUser.id,
              username: sessionUser.email?.split('@')[0] ?? 'user',
              email: sessionUser.email ?? undefined,
              role: 'admin',
            }
          : null,
      );
      setIsHydrated(true);
    };

    void init();
  }, []);

  useEffect(() => {
    localStorage.setItem('espresso_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (authMode === 'local') {
      localStorage.setItem('espresso_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    if (authMode === 'local') return;
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setCurrentUser(
        sessionUser
          ? {
              id: sessionUser.id,
              username: sessionUser.email?.split('@')[0] ?? 'user',
              email: sessionUser.email ?? undefined,
              role: 'admin',
            }
          : null,
      );
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (authMode === 'local') {
      const user = { id: '1', username: email.split('@')[0] ?? email, email, role: 'admin' as const };
      console.info('[auth] login', { userId: user.id, username: user.username });
      localStorage.setItem('espresso_user', JSON.stringify(user));
      setCurrentUser(user);
      router.push('/');
      return null;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    const sessionUser = data.user;
    if (sessionUser) {
      console.info('[auth] login', { userId: sessionUser.id, username: sessionUser.email });
      setCurrentUser({
        id: sessionUser.id,
        username: sessionUser.email?.split('@')[0] ?? 'user',
        email: sessionUser.email ?? undefined,
        role: 'admin',
      });
    }
    router.push('/');
    return null;
  };

  const logout = async () => {
    console.info('[auth] logout');
    if (authMode === 'local') {
      localStorage.setItem('espresso_user', JSON.stringify(null));
      setCurrentUser(null);
      router.push('/login');
      return;
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push('/login');
  };

  const addReport = (report: Omit<ReportItem, 'id'>) => {
    const newReport = { ...report, id: Date.now().toString() };
    console.info('[reports] create', { reportId: newReport.id, title: newReport.title });
    setReports((prev) => [newReport, ...prev]);
    router.push('/');
  };

  const updateReport = (id: string, updatedData: Partial<ReportItem>) => {
    console.info('[reports] update', { reportId: id });
    setReports((prev) => prev.map((report) => (report.id === id ? { ...report, ...updatedData } : report)));
    router.push(`/report/${id}`);
  };

  const deleteReport = (id: string) => {
    console.info('[reports] delete', { reportId: id });
    setReports((prev) => prev.filter((report) => report.id !== id));
    router.push('/');
  };

  return (
    <AppStateContext.Provider
      value={{
        theme,
        reports,
        currentUser,
        isHydrated,
        login,
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
