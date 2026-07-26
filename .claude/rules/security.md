---
description: セキュリティ設計方針（認証・通信・インジェクション対策・シークレット管理）
globs: 
---

# セキュリティ

## 認証・認可

- 認証方式: Supabase Auth（Google OAuth）。
- 管理者判定は `ADMIN_EMAIL` 環境変数をサーバーサイドAPI（`/api/auth/admin`）で判定する。クライアント環境変数（`NEXT_PUBLIC_*`）に出さない。
- API エンドポイントごとにアクセス制御を設定する（公開 / 認証必須）。
- RLS（Row Level Security）: Supabase 全テーブルで有効。SELECT は公開、INSERT/UPDATE/DELETE は認証ユーザーのみ。

## 通信・アクセス制御

- 全通信は **HTTPS** を必須とする（Vercel デプロイで自動適用）。
- **CORS** は許可するオリジンを明示的に指定する（`*` は本番で使用しない）。
- **レートリミット**を導入する。特に**認証系エンドポイント**（`/api/auth/admin` / `/api/auth/is-allowed`）は、総当たりや列挙を許さないよう厳しく制限する。
  - **現状 Route Handlers に実装は無い**（未対応）。実装は別 issue で扱う。本項は導入時の方針を定めるもので、既存コードの違反を意味しない。
- **CSP（Content-Security-Policy）ヘッダー**を設定する。Markdown 由来の HTML を描画するため、`rehype-sanitize` によるサニタイズと**多層防御**にする（片方だけに依存しない）。
  - 実装は `front/next.config.ts` の `headers()`。**現状は `Content-Security-Policy-Report-Only`（観測中）**であり、違反を確認してから強制に切り替える。付随ヘッダー（`X-Frame-Options` / `Referrer-Policy` / `X-Content-Type-Options` / `Permissions-Policy`）は強制済み。ディレクティブの一覧と根拠は `docs/06-security-specification.md` を参照。

## インジェクション対策

- **SQL インジェクション**: Prisma Client のパラメータバインディングを必須とする。`$queryRaw` での文字列結合は禁止。
- **XSS**: Markdown 表示は `rehype-sanitize` で必ずサニタイズする（デフォルトスキーマ使用）。ユーザー入力の生HTML挿入は行わない。
- **CSRF**: Bearer Token 認証（Cookie に保存しない）のため CSRF トークンは不要。

## シークレット管理

- ローカル環境: `.env.local`（`.gitignore` に追加必須）
- 本番環境: Vercel 環境変数で管理
- `ADMIN_EMAIL` / `DATABASE_URL` はサーバーサイド専用（`NEXT_PUBLIC_` プレフィックスを付けない）
