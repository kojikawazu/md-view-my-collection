# セキュリティ仕様書

認証・認可・インジェクション対策・シークレット管理を定義する。設計方針の正本は `.claude/rules/security.md`。

## 目次

- [認証・認可](#認証認可)
- [通信・アクセス制御](#通信アクセス制御)
- [インジェクション対策](#インジェクション対策)
- [シークレット管理](#シークレット管理)

## 認証・認可

- 認証方式: Supabase Auth（Google OAuth）。
- 管理者判定は `ADMIN_EMAIL` 環境変数をサーバーサイドAPI（`/api/auth/admin`）で判定する。クライアント環境変数（`NEXT_PUBLIC_*`）には出さない。複数指定はカンマ区切り。
- API エンドポイントごとにアクセス制御を設定する（公開 / 認証必須）。書き込み系は `requireAdmin()`（`front/src/lib/auth-server.ts`）+ RLS の二重防御。
- RLS: Supabase 全テーブルで有効。SELECT は公開、INSERT/UPDATE/DELETE は認証ユーザーのみ（詳細: `docs/05-data-specification.md`）。

## 通信・アクセス制御

- 全通信は **HTTPS** を必須とする（Vercel デプロイで自動適用）。
- **CORS** は許可するオリジンを明示的に指定する（`*` は本番で使用しない）。

## インジェクション対策

- **SQL インジェクション**: Prisma Client のパラメータバインディングを必須とする。`$queryRaw` での文字列結合は禁止。
- **XSS**: Markdown 表示は `rehype-sanitize`（デフォルトスキーマ）で必ずサニタイズする。ユーザー入力の生HTML挿入は行わない。`a`/`img` の許可属性は現状カスタム設定なし（必要ならスキーマ拡張で対応）。ライブラリ詳細は `docs/10-miscellaneous-specification.md`。
- **CSRF**: Bearer Token 認証（Cookie に保存しない）のため CSRF トークンは不要。

## シークレット管理

- ローカル環境: `front/.env.local`（`.gitignore` 対象）。
- 本番環境: Vercel 環境変数で管理。
- `ADMIN_EMAIL` / `DATABASE_URL` はサーバーサイド専用（`NEXT_PUBLIC_` プレフィックスを付けない）。
- シークレット・認証情報をコードにハードコードしない。

> 環境変数の一覧は `.claude/rules/environment.md` を参照。
