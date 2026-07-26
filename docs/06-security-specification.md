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
- **セキュリティヘッダー**を全レスポンスに付与する（`front/next.config.ts` の `headers()`）。

| ヘッダー | 値 | 状態 |
|---|---|---|
| `Content-Security-Policy-Report-Only` | 下表のディレクティブ | **観測中**（強制ではない） |
| `X-Content-Type-Options` | `nosniff` | 強制 |
| `X-Frame-Options` | `DENY` | 強制 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 強制 |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | 強制 |

### CSP ディレクティブ

| ディレクティブ | 値 | 理由 |
|---|---|---|
| `default-src` / `base-uri` / `form-action` | `'self'` | 既定を自オリジンに限定する |
| `object-src` | `'none'` | プラグイン埋め込みを一切許可しない |
| `frame-ancestors` | `'none'` | クリックジャッキング対策（`X-Frame-Options` と多層） |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | Next.js のハイドレーション用インラインスクリプトのため。**nonce 化は今後の課題** |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind / Swagger UI のインラインスタイルのため |
| `img-src` | `'self' data: blob: https:` | Markdown 本文が外部画像を参照しうるため |
| `connect-src` | `'self' <NEXT_PUBLIC_SUPABASE_URL>` | Supabase Auth / API との通信を許可する |

**Report-Only から始める理由**: いきなり強制すると Supabase Auth のリダイレクトや `/docs`（Swagger UI）が壊れうる。本番で違反レポートを観測してから `Content-Security-Policy` へ切り替える。Markdown の XSS 対策は `rehype-sanitize` が一次防御であり、CSP はその**多層防御**の位置づけ。

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
