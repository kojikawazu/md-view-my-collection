# セキュリティ仕様書

認証・認可・インジェクション対策・シークレット管理を定義する。設計方針の正本は `.claude/rules/security.md`。

## 目次

- [認証・認可](#認証認可)
- [通信・アクセス制御](#通信アクセス制御)
- [レートリミット（実装済み / Issue #146）](#レートリミット実装済み--issue-146)
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
| `Content-Security-Policy` | 下表のディレクティブ | **強制**（#147 で Report-Only 導入 → #166 で強制へ切替） |
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
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | Next.js のハイドレーション用インラインスクリプトのため。**nonce 化は見送り**（後述「nonce 化を見送る判断」） |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind / Swagger UI のインラインスタイルのため |
| `img-src` | `'self' data: blob: https:` | Markdown 本文が外部画像を参照しうるため |
| `connect-src` | `'self' <NEXT_PUBLIC_SUPABASE_URL>` | Supabase Auth / API との通信を許可する |

**位置づけ**: Markdown の XSS 対策は `rehype-sanitize` が一次防御であり、CSP はその**多層防御**。Report-Only のままでは違反がレポートされるだけでブロックされないため、実質的に単層防御に戻ってしまう。#147 では「いきなり強制すると Supabase Auth のリダイレクトや `/docs`（Swagger UI）が壊れうる」という理由で観測モードから始め、#166 で観測を経て強制へ切り替えた。

### CSP 強制化の観測記録（Issue #166 / 2026-08-22）

`report-uri` / `report-to` を設定していないため違反レポートの収集経路が無い。代わりに**ブラウザのコンソールを直接観測**した（Report-Only の違反は `[Report Only] Refused to ...` として出力される）。

| 観測対象 | 環境 | 結果 |
|---|---|---|
| 一覧 `/` · 詳細 `/report/:id` · ログイン `/login` | **本番**（`https://www.mdviewers.com`） | 違反 0 件 |
| ログイン → 一覧 → 作成 → 詳細 → 編集 → Markdown Lab | ローカル本番ビルド（`pnpm build && pnpm start` · localStorage モード） | 違反 0 件 |
| `/docs`（Swagger UI・8 オペレーション描画） | 同上（管理者ゲートを一時的に外して観測し、確認後に戻した） | 違反 0 件 |
| 本番の全 100 レポート本文の静的スキャン | — | `http://` 画像・生 HTML ともに 0 件 |

**Report-Only で違反が出ないことと、強制で壊れないことは別の観測**であるため、切り替えたうえで同じ導線を再度通した。Markdown の主要記法（見出し・表・コードブロック・引用・独自の「・」箇条書き・コールアウト）、外部 HTTPS 画像の読み込み、`next/font` の適用、Swagger UI の描画がいずれも壊れないことを確認している。`pnpm test:e2e`（33 ケース）も強制モードでグリーン。

**`img-src` に `https:` を残す理由**: 本番データに Markdown 画像は現時点で 0 件だが、本文が外部画像を参照しうる仕様は維持する。`http://` の画像は強制後にブロックされるが、混在コンテンツとしてブラウザが元々遮断するため実害は無い。

**フォントについて**: `next/font/google` はビルド時にフォントを取得して自オリジンから配信するため、`font-src 'self' data:` で足りる（Google Fonts のオリジンを許可する必要は無い）。

### nonce 化を見送る判断（Issue #166）

`script-src` の `'unsafe-inline' 'unsafe-eval'` は**残したまま**強制へ切り替えた。CSP の XSS 防御としては緩いが、次の理由で強制化とは切り離す。

- nonce はリクエストごとの発行が必要で、**`middleware.ts` の新設**を伴う。本プロジェクトは現在 middleware を持たず、全リクエストに処理を挟む構成変更になる
- Next.js App Router + React Compiler 構成で `'unsafe-eval'` を外せるかは未検証
- **強制化そのものに nonce 化は不要**であり、先に強制を有効にした方が「違反が実際にブロックされる」状態を早く得られる

したがって nonce 化は**別タスクとして残す**。着手する場合は middleware 導入の是非から判断する。

## レートリミット（実装済み / Issue #146）

実装は `front/src/lib/rate-limit.ts`（`checkRateLimit` / `rateLimitResponse`）。各 Route Handler の**先頭**で判定し、超過時は認可やトークン検証より前に 429 で打ち切る。

> **稼働の前提**: 環境変数 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` が設定されている場合のみ有効。**未設定の環境ではレートリミットは無効（素通し）になる**（E2E / CI を壊さないための設計。下記「無効化の条件」）。本番で効かせるには Vercel の環境変数設定が必要。

### 保護対象と制限

| エンドポイント | 制限（IP あたり） | 主な脅威 |
|---|---|---|
| `POST /api/auth/is-allowed` | 10 req / 分 | **トークン検証の濫用**（下記） |
| `GET /api/auth/admin` | 20 req / 分 | 同上。セッション復帰で複数回叩かれうるため is-allowed より緩い |
| `POST` / `PATCH` / `DELETE /api/reports` | 30 req / 分 | 濫用（`requireAdmin()` で保護済みのため副次的） |

読み取り系 GET（`/api/reports` / `/api/tags`）は公開データであり、CDN キャッシュ（`s-maxage=60`）が既に効くため対象外とする。

### 脅威の訂正（設計時の想定と実装の差）

設計段階（#146 起票時）は `POST /api/auth/is-allowed` の主脅威を「**メールアドレスの列挙**」としていた。**これは本番では成立しない。**

- 本番は supabase モードで動く。`is-allowed` は **Bearer トークン必須**で、トークンが無ければ 401 を返し、判定に入らない（実測で確認）
- トークンがあっても分かるのは「**そのトークンの持ち主自身のメール**が許可リストに載っているか」だけで、任意のメールを試すことはできない
- body の `email` を直接照合する経路は **local モード（E2E 専用）にのみ存在**し、本番からは到達できない

実際に残る脅威は次の 2 つで、レートリミットはこちらに効く。

1. **トークン検証の濫用**: 未認証の攻撃者でも、でたらめな Bearer トークンを付けて叩ける。その場合ハンドラは `supabase.auth.getUser(token)` を呼ぶため、**外部 API 呼び出しを無制限に誘発できる**（コスト・レイテンシへの攻撃）
2. **トークンの総当たり**: 上記と同じ経路で、有効なトークンを推測する試行を繰り返せる

### 手段の比較

| 手段 | 長所 | 短所 | 採否 |
|---|---|---|---|
| **Upstash Redis**（`@upstash/ratelimit`） | サーバーレスで正しく動く（インスタンス間でカウンタを共有）。テストを書ける。設定がリポジトリに残る | 外部サービスのアカウントと環境変数 2 つが必要。ネットワーク往復が 1 回増える | **採用** |
| Vercel Firewall / WAF | コード変更ゼロ。エッジで弾くためアプリに負荷が来ない | 設定がリポジトリに残らず、レビュー・再現ができない。テストを書けない | 併用可（未設定） |
| インメモリカウンタ | 外部依存なし | **サーバーレスではインスタンス間で共有されず実効性が低い**。ローカルとの挙動差が大きい | 不採用（「効いているつもり」が最も危険） |

### 実装の要点

- **アルゴリズムはスライディングウィンドウ**（`Ratelimit.slidingWindow`）。固定ウィンドウは境界をまたいだ瞬間に上限の 2 倍を通せるため採らない。
- **カウンタは対象ごとに分ける**（`prefix: ratelimit:<target>`）。`is-allowed` と `admin` は脅威が違い、片方の正常利用がもう片方の枠を食う状態にしない。
- **無効化の条件**: 環境変数が未設定なら常に通す。**警告は初回 1 回だけ出す**（毎回出すとログが埋まり、かえって「効いていない」事実が見えなくなる）。
- **Upstash への問い合わせが失敗した場合も通す**（フェイルオープン）。レートリミットの障害でログイン自体を止める方が損害が大きいため、可用性を優先する。
- **送信元 IP が判別できない場合は通さない**。`unknown` という単一バケットに寄せる（フェイルオープンにすると、ヘッダー欠落が総当たりの抜け道になる）。Vercel は `x-forwarded-for` をプラットフォーム側で設定するため、クライアントからは詐称できない。
- **429 応答は `{ error: string }` に揃え**（`.claude/rules/error-handling.md`）、`Retry-After` を秒で付与する。`reset` が過去でも最低 1 秒を返す（`Retry-After: 0` は「すぐ再試行してよい」の意味になり、上限超過の応答と矛盾するため）。
- **文言はサーバーとクライアントで共有**する（`front/src/constants/auth.ts` の `RATE_LIMIT_MESSAGE`）。
- **クライアントは 429 を「不許可」と区別する**。`AppStateProvider` の許可判定は `allowed` / `denied` / `rate-limited` の 3 状態を返す。429 を `denied` に混ぜると「許可されていないメールアドレスです」と表示され、原因を誤らせる。セッション復元では安全側に倒してサインアウトするが、遷移先は `/login?error=rate-limited` として理由を取り違えないようにする。

### 残作業

- Upstash のアカウント作成と、Vercel への環境変数 2 つの設定（**未実施**。設定するまで本番では無効）。
- Vercel Firewall の併用は未設定。

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
