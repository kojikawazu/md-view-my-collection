'use client';

// アプリ全体の状態（認証ユーザー・レポート一覧・タグ・フィルタ選択）を一元管理する
// 中枢プロバイダー。BFF（`/api/*`）越しのデータ取得・CRUD と Supabase Auth をここに集約する。
//
// このファイル全体を貫く重要な設計軸が「2 つの動作モード」:
//   - supabase モード（本番・既定）: 認証は Supabase Auth、データは BFF（Prisma 経由）
//   - local   モード（E2E 専用）  : 認証もデータも localStorage で完結（実 DB / OAuth を使わない）
// `authMode` / `dataMode`（環境変数）で分岐し、各関数が両モードの実装を内包する。
// 詳細は `.claude/rules/environment.md`・`docs/06-security-specification.md` を参照。

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_COOKIE_NAME } from '@/constants/auth';
import { ESPRESSO_THEME } from '@/constants/theme';
import type { MutationResult } from '@/types/api';
import type { ReportItem } from '@/types/report';
import type { DesignSystem } from '@/types/theme';
import type { User } from '@/types/user';
import { supabase } from '@/lib/supabaseClient';

/**
 * アプリ横断の状態と操作を公開するコンテキストの形。
 *
 * 状態（読み取り）とミューテーション（書き込み操作）を 1 つの値にまとめ、
 * 配下コンポーネントが `useAppState()` 経由で参照する。
 */
interface AppState {
  /** 配色・スタイル定義（現状は固定テーマ）。 */
  theme: DesignSystem;
  /** 表示中のレポート一覧。一覧 API では content を除外した軽量版が入る。 */
  reports: ReportItem[];
  /** サイドバーのフィルタ候補となるタグ一覧（reports から派生）。 */
  tags: string[];
  /** サイドバーで選択中のカテゴリ。未選択は null。 */
  selectedCategory: string | null;
  /** カテゴリ選択を更新する（同一値の再クリックで null に戻す運用は呼び出し側で行う）。 */
  setSelectedCategory: (category: string | null) => void;
  /** サイドバーで選択中のタグ。未選択は null。 */
  selectedTag: string | null;
  /** タグ選択を更新する。 */
  setSelectedTag: (tag: string | null) => void;
  /** ログイン中の管理者。未ログインは null。 */
  currentUser: User | null;
  /** 初期化（データ取得 + 認証復元）が完了したか。false の間はローディング表示に使う。 */
  isHydrated: boolean;
  /**
   * メール/パスワードでログインする。
   * @returns 成功時は null、失敗時はエラーメッセージ
   */
  login: (email: string, password: string) => Promise<string | null>;
  /**
   * Google OAuth でログインする（supabase モードのみ有効）。
   * @returns 成功時は null、失敗時はエラーメッセージ
   */
  loginWithGoogle: () => Promise<string | null>;
  /** ログアウトしてログイン画面へ遷移する。 */
  logout: () => Promise<void>;
  /** レポートを新規作成する。 */
  addReport: (report: Omit<ReportItem, 'id'>) => Promise<MutationResult>;
  /** レポートを部分更新する。 */
  updateReport: (id: string, updatedData: Partial<ReportItem>) => Promise<MutationResult>;
  /** レポートを削除する。 */
  deleteReport: (id: string) => Promise<MutationResult>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

/**
 * アプリ状態コンテキストを取得するフック。
 *
 * プロバイダー外での誤用を早期検知するため、未提供時は例外を投げる
 * （no-op フォールバックを返すと状態不整合が黙って進行するため、あえて fail-fast）。
 *
 * @returns アプリ横断の状態と操作
 * @throws {Error} `AppStateProvider` の外で呼ばれた場合
 */
export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

/**
 * アプリ全体の状態・認証・CRUD を提供するプロバイダー。
 *
 * マウント時に「レポート/タグ取得」と「認証セッション復元」を並行実行し、
 * 完了後に `isHydrated` を true にする。supabase モードでは認証状態変化も購読する。
 */
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

  /**
   * ミドルウェア等のサーバー側が認証状態を判定するための目印 Cookie を張り替える。
   *
   * 認証の実体は Bearer トークン（CSRF 対策で Cookie に置かない方針）だが、
   * サーバーはリクエスト時にトークンを持たないため、遷移制御用の非機密フラグのみ Cookie に持たせる。
   * 認証時は 7 日（604800 秒）で発行し、未認証時は Max-Age=0 で即時失効させる。
   *
   * @param isAuthenticated 認証済みなら true（フラグ発行）、未認証なら false（フラグ削除）
   */
  const setAuthFlagCookie = (isAuthenticated: boolean) => {
    if (typeof document === 'undefined') return;
    if (isAuthenticated) {
      document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; Max-Age=604800; SameSite=Lax`;
      return;
    }
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  };

  /**
   * ログインしようとしているメールが管理者許可リストに含まれるかをサーバーで照合する。
   *
   * 判定ロジックはモードで分岐する:
   *   - local   : メールを body で送り `/api/auth/is-allowed`（POST）で照合
   *   - supabase: Bearer トークンを送り `/api/auth/admin`（GET）で照合（メールを露出させない）
   * `ADMIN_EMAIL` はサーバー専用のため判定は必ず API 越しに行う（クライアントに秘匿値を出さない）。
   * 通信失敗時は安全側に倒して不許可（false）を返す。
   *
   * @returns 許可メールなら true、非許可・トークン欠落・通信失敗なら false
   */
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

  /**
   * レポート群から重複を除いたタグ一覧を導出する。
   *
   * タグ用 API を別途叩かず reports から派生させることで、mutation 後の余計な再取得を避け、
   * サイドバー表示と一覧データの整合を常に保つ（`fetchTags` 廃止に伴う一元化）。
   *
   * @param items タグを収集する対象のレポート配列
   * @returns 空値を除いたユニークなタグ配列
   */
  const deriveTagsFromReports = (items: ReportItem[]) =>
    Array.from(new Set(items.flatMap((report) => report.tags ?? []).filter(Boolean)));

  /**
   * レポート一覧を取得して状態に反映する。
   *
   * local モードは localStorage から復元（`externalUrls` 欠落を空配列で補正）、
   * supabase モードは BFF（`/api/reports`）から取得する。いずれも失敗時は空配列にフォールバックし、
   * 描画側が undefined を踏まないようにする。
   */
  const fetchReports = async () => {
    if (dataMode === 'local') {
      const savedReports = localStorage.getItem('espresso_reports');
      if (savedReports) {
        try {
          const parsedReports = (JSON.parse(savedReports) as ReportItem[]).map((r) => ({
            ...r,
            externalUrls: r.externalUrls ?? [],
          }));
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

  /**
   * サイドバー用のタグ一覧を取得して状態に反映する。
   *
   * 初期化時のみ使用する。local モードは localStorage から派生、supabase モードは
   * `/api/tags`（ReportTag テーブル由来）から取得する。mutation 後の更新は API を叩かず
   * `deriveTagsFromReports` で reports から導出する（不要な API 呼び出しを避けるため）。
   */
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

  // マウント時の初期化: データ取得と認証復元を並行実行し、完了後に isHydrated を立てる。
  useEffect(() => {
    // 保存済みセッション/ユーザーを復元し、許可メールでなければサインアウトさせる。
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
    // マウント時に一度だけ初期化する（依存を空に固定するのは意図的）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // local モードでは reports を localStorage に永続化し、タグを派生させる。
  useEffect(() => {
    if (dataMode === 'local') {
      localStorage.setItem('espresso_reports', JSON.stringify(reports));
      setTags(deriveTagsFromReports(reports));
    }
  }, [reports, dataMode]);

  // local モードのみ currentUser を localStorage に永続化する。
  // isHydrated 前は初期 null で保存済みユーザーを上書きしてしまうため、初期化完了までスキップする。
  useEffect(() => {
    if (authMode === 'local') {
      if (!isHydrated) return;
      localStorage.setItem('espresso_user', JSON.stringify(currentUser));
    }
  }, [currentUser, authMode, isHydrated]);

  // 認証状態が変わるたびサーバー判定用のフラグ Cookie を同期する（初期化完了後のみ）。
  useEffect(() => {
    if (!isHydrated) return;
    setAuthFlagCookie(Boolean(currentUser));
  }, [currentUser, isHydrated]);

  // supabase モードでの認証状態変化（OAuth リダイレクト後のサインインやトークン更新等）を購読し、
  // 許可メールの再検証つきで currentUser / accessToken を同期する。
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
    // 認証購読はマウント時に一度だけ登録する（依存を空に固定するのは意図的）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * メール/パスワードでログインする。
   *
   * どちらのモードでも「許可メール照合」を通過した場合のみログインを確定する。
   * 非許可なら supabase モードでは即サインアウトし、エラーメッセージを返す（画面側で表示）。
   *
   * @param email 入力メールアドレス
   * @param password 入力パスワード（local モードでは未使用のダミー扱い）
   * @returns 成功時は null、失敗時はユーザー向けエラーメッセージ
   */
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
      // メールアドレスは個人情報のためログに出さない（error-handling.md）。追跡は userId で足りる
      console.info('[auth] login', { userId: sessionUser.id });
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

  /**
   * Google OAuth でログインする。
   *
   * local モードでは OAuth を使わないため何もせず null を返す。supabase モードでは
   * リダイレクト先を `NEXT_PUBLIC_SITE_URL` 優先で決め、無ければ実行時の origin にフォールバックする
   * （本番のリダイレクト URL 固定と、ローカル/プレビューでの動作を両立させるため）。
   * 実際の許可メール検証は、リダイレクト後に発火する onAuthStateChange 側で行う。
   *
   * @returns 成功時は null、OAuth 開始に失敗した場合はエラーメッセージ
   */
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

  /**
   * ログアウトしてログイン画面へ遷移する。
   *
   * ローカル状態（currentUser / accessToken）とフラグ Cookie をクリアし、
   * supabase モードでは Supabase 側セッションも破棄する。
   */
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

  /**
   * レポートを新規作成し、成功時は一覧の先頭に反映して一覧画面へ遷移する。
   *
   * local モードはクライアント側で ID を採番して localStorage に追加、supabase モードは
   * Bearer トークン付きで `/api/reports`（POST）へ送る。楽観更新はせず、API 応答（作成済みレコード）で
   * 状態を更新し、タグは reports から再導出する。
   *
   * @param report id を除いたレポート入力値
   * @returns 成功可否・エラー内容を表す MutationResult（フィールド別バリデーションエラーを含みうる）
   */
  const addReport = async (report: Omit<ReportItem, 'id'>): Promise<MutationResult> => {
    if (dataMode === 'local') {
      const newReport = {
        ...report,
        id: Date.now().toString(),
        externalUrls: (report.externalUrls ?? []).map((eu, i) => ({
          id: `eu-${Date.now()}-${i}`,
          url: eu.url,
          label: eu.label ?? null,
        })),
      };
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
      setReports((prev) => {
        const nextReports = [created, ...prev];
        setTags(deriveTagsFromReports(nextReports));
        return nextReports;
      });
      router.push('/');
      return { ok: true };
    } catch (error) {
      console.error('[reports] create failed', error);
      return { ok: false, status: 500, error: 'Network error' };
    }
  };

  /**
   * レポートを部分更新し、成功時は該当詳細画面へ遷移する。
   *
   * local モードは外部URLに欠落 ID を補ってから localStorage を書き換え、supabase モードは
   * Bearer トークン付きで `/api/reports/{id}`（PATCH）へ送り、応答レコードで状態を置き換える。
   *
   * @param id 更新対象レポートの ID
   * @param updatedData 変更したいフィールドのみを含む部分オブジェクト
   * @returns 成功可否・エラー内容を表す MutationResult
   */
  const updateReport = async (
    id: string,
    updatedData: Partial<ReportItem>,
  ): Promise<MutationResult> => {
    if (dataMode === 'local') {
      console.info('[reports] update', { reportId: id });
      if (updatedData.externalUrls) {
        updatedData = {
          ...updatedData,
          externalUrls: updatedData.externalUrls.map((eu, i) => ({
            id: eu.id || `eu-${Date.now()}-${i}`,
            url: eu.url,
            label: eu.label ?? null,
          })),
        };
      }
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
      setReports((prev) => {
        const nextReports = prev.map((report) => (report.id === id ? updated : report));
        setTags(deriveTagsFromReports(nextReports));
        return nextReports;
      });
      router.push(`/report/${id}`);
      return { ok: true };
    } catch (error) {
      console.error('[reports] update failed', error);
      return { ok: false, status: 500, error: 'Network error' };
    }
  };

  /**
   * レポートを削除し、成功時は一覧から除いて一覧画面へ遷移する。
   *
   * local モードは localStorage から除外、supabase モードは Bearer トークン付きで
   * `/api/reports/{id}`（DELETE）へ送る。削除後はタグを reports から再導出する。
   *
   * @param id 削除対象レポートの ID
   * @returns 成功可否・エラー内容を表す MutationResult
   */
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
      setReports((prev) => {
        const nextReports = prev.filter((report) => report.id !== id);
        setTags(deriveTagsFromReports(nextReports));
        return nextReports;
      });
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
