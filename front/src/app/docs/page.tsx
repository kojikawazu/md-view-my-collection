'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { supabase } from '@/lib/supabaseClient';
import 'swagger-ui-react/swagger-ui.css';

// Swagger UI は SSR 非対応かつ重いため、クライアントで動的読み込みする。
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false }) as ComponentType<{
  spec: object;
}>;

/**
 * API リファレンス（管理者のみ）。
 * Supabase セッションのトークンで管理者ゲート付き `/api/openapi` を読み込み、Swagger UI で描画する。
 */
export default function DocsPage() {
  const { currentUser, isHydrated } = useAppState();
  const [spec, setSpec] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated || !currentUser) return;
    let active = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError('アクセストークンを取得できませんでした。再ログインしてください。');
        return;
      }
      const res = await fetch('/api/openapi', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        setError(`API ドキュメントの取得に失敗しました（${res.status}）。`);
        return;
      }
      const json = (await res.json()) as object;
      if (active) setSpec(json);
    };

    void load().catch(() => setError('API ドキュメントの取得に失敗しました。'));
    return () => {
      active = false;
    };
  }, [isHydrated, currentUser]);

  if (!isHydrated) {
    return <main className="p-6 text-sm text-gray-500">読み込み中…</main>;
  }

  if (!currentUser) {
    return (
      <main className="p-6">
        <h1 className="text-lg font-bold">API リファレンス</h1>
        <p className="mt-2 text-sm text-gray-600">
          このページは管理者のみ閲覧できます。
          <Link href="/login" className="ml-1 text-blue-600 underline">
            ログイン
          </Link>
          してください。
        </p>
      </main>
    );
  }

  if (error) {
    return <main className="p-6 text-sm text-red-700">{error}</main>;
  }

  if (!spec) {
    return <main className="p-6 text-sm text-gray-500">API ドキュメントを読み込み中…</main>;
  }

  return (
    <main>
      <SwaggerUI spec={spec} />
    </main>
  );
}
