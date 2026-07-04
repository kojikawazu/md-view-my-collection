import { vi } from 'vitest';

/**
 * Supabase Auth をモックする（IT は実 DB を使うが認証はモック方針）。
 *
 * `createClient()` が返すクライアントの `auth.getUser(token)` を、トークン→ユーザーの
 * 固定規約で解決する。これにより `requireAdmin` / auth ルートの実ロジック
 * （トークン解析・ADMIN_EMAIL 照合・401/403/200 分岐）を実 DB 上で検証できる。
 *
 * 規約:
 * - `admin-token` → 管理者メール（ADMIN_EMAIL 一致）
 * - `user-token`  → 非管理者メール
 * - それ以外       → 無効トークン（error）
 */
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async (token?: string) => {
        if (token === 'admin-token') {
          return { data: { user: { email: 'admin@example.com' } }, error: null };
        }
        if (token === 'user-token') {
          return { data: { user: { email: 'nonadmin@example.com' } }, error: null };
        }
        return { data: { user: null }, error: { message: 'invalid token' } };
      },
    },
  }),
}));
