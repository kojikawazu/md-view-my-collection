# セキュリティ仕様書

認証・認可・インジェクション対策・シークレット管理を定義する。設計方針の正本は `.claude/rules/security.md`。

## 目次

- [認証・認可](#認証認可)
- [通信・アクセス制御](#通信アクセス制御)
- [レートリミット設計（未実装）](#レートリミット設計未実装)
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

## レートリミット設計（未実装）

**現状 Route Handlers にレートリミットの実装は無い。** 本節は実装前の設計であり、実装は Issue #146 で継続する。

### 保護対象と脅威

| エンドポイント | 脅威 | 想定制限 |
|---|---|---|
| `POST /api/auth/is-allowed` | **メールアドレスの列挙**（許可リストに載っているかを総当たりで判定できる） | IP あたり 10 req / 分 |
| `GET /api/auth/admin` | 管理者判定の総当たり（Bearer トークンの推測） | IP あたり 20 req / 分 |
| `POST` / `PATCH` / `DELETE /api/reports` | 濫用（`requireAdmin()` で保護済みのため副次的） | IP あたり 30 req / 分 |

読み取り系 GET（`/api/reports` / `/api/tags`）は公開データであり、CDN キャッシュ（`s-maxage=60`）が既に効くため対象外とする。

### 手段の比較

| 手段 | 長所 | 短所 | 評価 |
|---|---|---|---|
| **Upstash Redis**（`@upstash/ratelimit`） | サーバーレスで正しく動く（インスタンス間でカウンタを共有）。テストを書ける。設定がリポジトリに残る | 外部サービスのアカウントと環境変数 2 つが必要。ネットワーク往復が 1 回増える | **本命** |
| Vercel Firewall / WAF | コード変更ゼロ。エッジで弾くためアプリに負荷が来ない | 設定がリポジトリに残らず、レビュー・再現ができない。テストを書けない | 補完として併用可 |
| インメモリカウンタ | 外部依存なし | **サーバーレスではインスタンス間で共有されず実効性が低い**。ローカルとの挙動差が大きい | 単独では不採用 |

**方針**: Upstash Redis を主とし、Vercel Firewall を粗いフィルタとして併用しうる形にする。インメモリは採らない（「効いているつもり」が最も危険なため）。

### 実装時の制約

- **429 応答は `{ error: string }` に揃える**（`.claude/rules/error-handling.md` の統一エラーレスポンス）。`Retry-After` ヘッダーを付与する。
- **E2E（local モード）を壊さないこと。** 環境変数が未設定なら**レートリミットを無効化して通す**設計にする（CI では Upstash に接続しない）。
- クライアント側は 429 を「時間をおいて再試行してください」の文言で表示する。
- 正常 / 準正常（上限直前）/ 異常（上限超過で 429）の 3 分類でテストを追加する（`.claude/rules/testing.md`）。
- 環境変数（`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`）は**サーバー専用**とし、`NEXT_PUBLIC_` を付けない。追加時は `.claude/rules/environment.md` と本書の環境変数一覧を更新する。

## インジェクション対策

- **SQL インジェクション**: Prisma Client のパラメータバインディングを必須とする。`$queryRaw` での文字列結合は禁止。
- **XSS**: Markdown 表示は `rehype-sanitize`（デフォルトスキーマ）で必ずサニタイズする。ユーザー入力の生HTML挿入は行わない。`a`/`img` の許可属性は現状カスタム設定なし（必要ならスキーマ拡張で対応）。ライブラリ詳細は `docs/10-miscellaneous-specification.md`。
- **CSRF**: Bearer Token 認証（Cookie に保存しない）のため CSRF トークンは不要。

## シークレット管理

- ローカル環境: `front/.env.local`（`.gitignore` 対象）。
- 本番環境: Vercel 環境変数で管理。
- `ADMIN_EMAIL` / `DATABASE_URL` はサーバーサイド専用（`NEXT_PUBLIC_` プレフィックスを付けない）。
- シークレット・認証情報をコードにハードコードしない。
- サーバー専用モジュール（`front/src/lib/db.ts` / `front/src/lib/auth-server.ts`）は先頭で `import 'server-only'` する。Client Component から誤って import された場合に**ビルドを失敗させ**、シークレットのクライアントバンドル混入を機械的に防ぐ。

> 環境変数の一覧は `.claude/rules/environment.md` を参照。
