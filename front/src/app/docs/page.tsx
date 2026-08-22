'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { supabase } from '@/lib/supabaseClient';
import { ApiError } from '@/repositories/client';
import { fetchOpenApiSpec } from '@/repositories/openapi';
import 'swagger-ui-dist/swagger-ui.css';

/**
 * API リファレンス（管理者のみ）。
 * Supabase セッションのトークンで管理者ゲート付き `/api/openapi` を読み込み、Swagger UI で描画する。
 *
 * 描画には React ラッパー（`swagger-ui-react`）ではなく **`swagger-ui-dist` の自己完結バンドル**を使う。
 * ラッパー経由だと apidom（OAS 3.1 の解決に使われる）がバンドラの解決を通る際に壊れ、
 * オペレーションを展開してもパラメータ・リクエストボディ・レスポンスが一切描画されなかった（Issue #197）。
 */
export default function DocsPage() {
  const { currentUser, isHydrated } = useAppState();
  const [spec, setSpec] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      try {
        const json = await fetchOpenApiSpec(token);
        if (active) setSpec(json);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? `API ドキュメントの取得に失敗しました（${err.status}）。`
            : 'API ドキュメントの取得に失敗しました。',
        );
      }
    };

    void load().catch(() => setError('API ドキュメントの取得に失敗しました。'));
    return () => {
      active = false;
    };
  }, [isHydrated, currentUser]);

  useEffect(() => {
    const node = containerRef.current;
    if (!spec || !node) return;
    let active = true;

    // 自己完結バンドルは大きく、かつブラウザ専用（SSR 不可）のためクライアントで動的に読み込む。
    void import('swagger-ui-dist/swagger-ui-bundle.js').then(({ default: SwaggerUIBundle }) => {
      if (active) SwaggerUIBundle({ spec, domNode: node });
    });

    return () => {
      active = false;
      // Swagger UI が描画した DOM は React の管理外（この div に children を渡していない）。
      // 破棄はこちらの責務になるため、アンマウント時に明示的に空にする。
      node.replaceChildren();
    };
  }, [spec]);

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
      <div ref={containerRef} />
    </main>
  );
}
