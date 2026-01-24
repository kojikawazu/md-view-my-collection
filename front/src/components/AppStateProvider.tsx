'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ESPRESSO_THEME, INITIAL_REPORTS } from '../constants';
import { DesignSystem, ReportItem, User } from '../types';

interface AppState {
  theme: DesignSystem;
  reports: ReportItem[];
  currentUser: User | null;
  isHydrated: boolean;
  login: (user: User) => void;
  logout: () => void;
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

  useEffect(() => {
    const savedReports = localStorage.getItem('espresso_reports');
    if (savedReports) {
      try {
        setReports(JSON.parse(savedReports));
      } catch {
        setReports(INITIAL_REPORTS);
      }
    }

    const savedUser = localStorage.getItem('espresso_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        setCurrentUser(null);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('espresso_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('espresso_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const login = (user: User) => {
    console.info('[auth] login', { userId: user.id, username: user.username });
    localStorage.setItem('espresso_user', JSON.stringify(user));
    setCurrentUser(user);
    router.push('/');
  };

  const logout = () => {
    console.info('[auth] logout');
    localStorage.setItem('espresso_user', JSON.stringify(null));
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
