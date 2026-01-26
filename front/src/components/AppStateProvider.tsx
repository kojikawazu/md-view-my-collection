'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ESPRESSO_THEME } from '../constants';
import { DesignSystem, ReportItem, User } from '../types';
import { supabase } from '../lib/supabaseClient';

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
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const theme = ESPRESSO_THEME;
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'supabase';
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE ?? 'supabase';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const adminEmailConfig = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? '';

  const getAllowedEmails = () =>
    adminEmailConfig
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

  const isAllowedEmail = (email?: string | null) => {
    const allowed = getAllowedEmails();
    if (!email || allowed.length === 0) return false;
    return allowed.includes(email.toLowerCase());
  };

  type ReportTagRef = { name: string | null };

  type ReportRow = Omit<ReportItem, 'tags'> & {
    ReportTagMapping?: {
      id: string;
      reportTagId: string;
      ReportTag?: ReportTagRef | ReportTagRef[] | null;
    }[];
  };

  type ReportTagMappingRow = {
    id: string;
    reportTagId: string;
    ReportTag?: ReportTagRef | ReportTagRef[] | null;
  };

  const normalizeReport = (report: ReportItem) => ({
    ...report,
    publishDate: report.publishDate ?? null,
    tags: report.tags ?? [],
    summary: report.summary ?? null,
  });

  const toReportPayload = (report: Partial<ReportItem>) => {
    const payload = {
      title: report.title,
      summary: report.summary ?? null,
      content: report.content,
      category: report.category,
      author: report.author,
      publishDate: report.publishDate ?? null,
    };
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  };

  const normalizeTagNames = (tags: string[]) =>
    Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));

  const deriveTagsFromReports = (items: ReportItem[]) =>
    normalizeTagNames(items.flatMap((report) => report.tags ?? []));

  const mapReportFromDb = (report: ReportRow): ReportItem => {
    const tagMappings = report.ReportTagMapping ?? [];
    const tags = tagMappings
      .map((mapping) => {
        const reportTag = Array.isArray(mapping.ReportTag) ? mapping.ReportTag[0] : mapping.ReportTag;
        return reportTag?.name ?? null;
      })
      .filter((tag): tag is string => Boolean(tag));
    const { ReportTagMapping: _ignored, ...rest } = report;
    return normalizeReport({ ...(rest as ReportItem), tags });
  };

  const ensureTags = async (tags: string[]) => {
    const normalized = normalizeTagNames(tags);
    if (normalized.length === 0) return [];
    const { data: existing, error } = await supabase
      .from('ReportTag')
      .select('id, name')
      .in('name', normalized);
    if (error) {
      console.error('[tags] fetch failed', error.message);
      return null;
    }
    const existingTags = existing ?? [];
    const existingNames = new Set(existingTags.map((tag) => tag.name));
    const missing = normalized.filter((name) => !existingNames.has(name));
    if (missing.length === 0) return existingTags;
    const newTags = missing.map((name) => ({ id: crypto.randomUUID(), name }));
    const { data: inserted, error: insertError } = await supabase
      .from('ReportTag')
      .insert(newTags)
      .select('id, name');
    if (insertError) {
      console.error('[tags] create failed', insertError.message);
      return null;
    }
    return [...existingTags, ...(inserted ?? newTags)];
  };

  const syncReportTags = async (reportId: string, tags: string[]) => {
    const normalized = normalizeTagNames(tags);
    if (normalized.length === 0) {
      const { error } = await supabase.from('ReportTagMapping').delete().eq('reportId', reportId);
      if (error) {
        console.error('[tags] clear failed', error.message);
      }
      return [];
    }

    const tagRows = await ensureTags(normalized);
    if (!tagRows) return null;
    const tagIdByName = new Map(tagRows.map((tag) => [tag.name, tag.id]));
    const desiredTagIds = normalized.map((name) => tagIdByName.get(name)).filter(Boolean) as string[];

    const { data: existingMappings, error } = await supabase
      .from('ReportTagMapping')
      .select('id, reportTagId, ReportTag(name)')
      .eq('reportId', reportId);
    if (error) {
      console.error('[tags] mapping fetch failed', error.message);
      return null;
    }

    const existing = (existingMappings ?? []) as ReportTagMappingRow[];
    const existingTagIds = new Set(existing.map((mapping) => mapping.reportTagId));

    const toInsert = desiredTagIds
      .filter((tagId) => !existingTagIds.has(tagId))
      .map((reportTagId) => ({ id: crypto.randomUUID(), reportId, reportTagId }));
    const toDeleteIds = existing
      .filter((mapping) => {
        const reportTag = Array.isArray(mapping.ReportTag) ? mapping.ReportTag[0] : mapping.ReportTag;
        const name = reportTag?.name ?? '';
        return name && !normalized.includes(name);
      })
      .map((mapping) => mapping.id);

    if (toDeleteIds.length > 0) {
      const { error: deleteError } = await supabase.from('ReportTagMapping').delete().in('id', toDeleteIds);
      if (deleteError) {
        console.error('[tags] mapping delete failed', deleteError.message);
        return null;
      }
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('ReportTagMapping').insert(toInsert);
      if (insertError) {
        console.error('[tags] mapping create failed', insertError.message);
        return null;
      }
    }

    return normalized;
  };

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

    const { data, error } = await supabase
      .from('Report')
      .select('*, ReportTagMapping(ReportTag(name))')
      .order('createdAt', { ascending: false });
    if (error) {
      console.error('[reports] fetch failed', error.message);
      setReports([]);
      return;
    }
    setReports((data ?? []).map(mapReportFromDb));
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

    const { data, error } = await supabase.from('ReportTag').select('name').order('name');
    if (error) {
      console.error('[tags] fetch failed', error.message);
      setTags([]);
      return;
    }
    const names = (data ?? []).map((tag) => tag.name).filter(Boolean) as string[];
    setTags(names);
  };

  useEffect(() => {
    const init = async () => {
      await fetchReports();
      await fetchTags();

      if (authMode === 'local') {
        const savedUser = localStorage.getItem('espresso_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser) as User | null;
            if (parsedUser?.email && !isAllowedEmail(parsedUser.email)) {
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
        setIsHydrated(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      if (sessionUser) {
        if (!isAllowedEmail(sessionUser.email)) {
          await supabase.auth.signOut();
          setCurrentUser(null);
          router.push('/login?error=unauthorized');
          setIsHydrated(true);
          return;
        }
        setCurrentUser({
          id: sessionUser.id,
          username: 'Manager',
          email: sessionUser.email ?? undefined,
          role: 'admin',
        });
      } else {
        setCurrentUser(null);
      }
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
    if (authMode === 'local') return;
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      if (sessionUser && !isAllowedEmail(sessionUser.email)) {
        void supabase.auth.signOut();
        setCurrentUser(null);
        router.push('/login?error=unauthorized');
        return;
      }
      setCurrentUser(
        sessionUser
          ? {
              id: sessionUser.id,
              username: 'Manager',
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
      const user = { id: '1', username: 'Manager', email, role: 'admin' as const };
      if (!isAllowedEmail(user.email)) {
        return '許可されていないメールアドレスです。';
      }
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
      if (!isAllowedEmail(sessionUser.email)) {
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
      router.push('/login');
      return;
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push('/login');
  };

  const addReport = (report: Omit<ReportItem, 'id'>) => {
    if (dataMode === 'local') {
      const newReport = { ...report, id: Date.now().toString() };
      console.info('[reports] create', { reportId: newReport.id, title: newReport.title });
      setReports((prev) => {
        const nextReports = [newReport, ...prev];
        setTags(deriveTagsFromReports(nextReports));
        return nextReports;
      });
      router.push('/');
      return;
    }

    const create = async () => {
      const payload = {
        id: crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
        ...toReportPayload(report),
      };
      const { data, error } = await supabase
        .from('Report')
        .insert(payload)
        .select('*')
        .single();
      if (error) {
        console.error('[reports] create failed', error.message);
        return;
      }
      if (data) {
        const syncedTags = await syncReportTags(data.id, report.tags ?? []);
        const tags = syncedTags ?? normalizeTagNames(report.tags ?? []);
        setReports((prev) => [normalizeReport({ ...data, tags }), ...prev]);
        await fetchTags();
        router.push('/');
      }
    };
    void create();
  };

  const updateReport = (id: string, updatedData: Partial<ReportItem>) => {
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
      return;
    }

    const update = async () => {
      const payload = toReportPayload(updatedData);
      const { data, error } = await supabase
        .from('Report')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();
      if (error) {
        console.error('[reports] update failed', error.message);
        return;
      }
      if (data) {
        let syncedTags: string[] | null = null;
        if (Array.isArray(updatedData.tags)) {
          syncedTags = await syncReportTags(id, updatedData.tags);
        }
        console.info('[reports] update', { reportId: id });
        setReports((prev) =>
          prev.map((reportItem) => {
            if (reportItem.id !== id) return reportItem;
            const tags = Array.isArray(updatedData.tags)
              ? syncedTags ?? normalizeTagNames(updatedData.tags)
              : reportItem.tags;
            return normalizeReport({ ...data, tags });
          }),
        );
        await fetchTags();
        router.push(`/report/${id}`);
      }
    };
    void update();
  };

  const deleteReport = (id: string) => {
    if (dataMode === 'local') {
      console.info('[reports] delete', { reportId: id });
      setReports((prev) => {
        const nextReports = prev.filter((report) => report.id !== id);
        setTags(deriveTagsFromReports(nextReports));
        return nextReports;
      });
      router.push('/');
      return;
    }

    const remove = async () => {
      const { error } = await supabase.from('Report').delete().eq('id', id);
      if (error) {
        console.error('[reports] delete failed', error.message);
        return;
      }
      console.info('[reports] delete', { reportId: id });
      setReports((prev) => prev.filter((report) => report.id !== id));
      router.push('/');
    };
    void remove();
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
