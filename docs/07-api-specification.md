# APIルート設計書（認証認可・DB操作の移行）

> 本書は仕様（What）に加え、APIルート移行時の**設計判断（How）**を含む設計書です。

> **API 契約（パス・リクエスト/レスポンス・ステータス）の正準は [`openapi.json`](openapi.json)（zod スキーマから `pnpm gen:openapi` で生成）。本書は設計判断・補足・エンドポイント概要を担う。**

## 目次

- [API 契約の正準（openapi.json）](#api-契約の正準openapijson)
- [概要](#概要)
  - [移行の目的](#移行の目的)
  - [スコープ外](#スコープ外)
- [設計判断（レビュー指摘への回答）](#設計判断レビュー指摘への回答)
  - [DJ-1. データ読み込みモデル: クライアント側全件保持を維持する](#dj-1-データ読み込みモデル-クライアント側全件保持を維持する)
  - [DJ-2. タグの canonical form: `#` 付きで維持する](#dj-2-タグの-canonical-form--付きで維持する)
  - [DJ-3. APIエラーのUI返却契約を定義する](#dj-3-apiエラーのui返却契約を定義する)
  - [DJ-4. accessToken のリロード時復元](#dj-4-accesstoken-のリロード時復元)
  - [DJ-5. APIルートの自動テスト方針](#dj-5-apiルートの自動テスト方針)
  - [DJ-6. カテゴリの固定リストバリデーション](#dj-6-カテゴリの固定リストバリデーション)
- [参照元: youtube-my-collection のパターン](#参照元-youtube-my-collection-のパターン)
  - [ファイル構成](#ファイル構成)
  - [認可フロー](#認可フロー)
  - [youtube-my-collection との差分](#youtube-my-collection-との差分)
- [新規ファイル設計](#新規ファイル設計)
  - [1. `front/src/lib/auth-server.ts` — サーバー側認可ミドルウェア](#1-frontsrclibauth-serverts--サーバー側認可ミドルウェア)
  - [2. `front/src/lib/db.ts` — Prismaクライアントシングルトン](#2-frontsrclibdbts--prismaクライアントシングルトン)
  - [3. `front/src/lib/schemas/` と `front/src/lib/validation.ts` — zod スキーマとアダプタ](#3-frontsrclibschemas-と-frontsrclibvalidationts--zod-スキーマとアダプタ)
  - [4. `front/src/types.ts` — 追加型定義](#4-frontsrctypests--追加型定義)
- [APIルート設計（エンドポイント概要）](#apiルート設計エンドポイント概要)
  - [`GET /api/auth/admin` の設計補足](#get-apiauthadmin-の設計補足)
  - [`GET /api/reports` の設計補足（DJ-1）](#get-apireports-の設計補足dj-1)
  - [`POST /api/reports` / `PATCH /api/reports/[id]` のタグ同期](#post-apireports--patch-apireportsid-のタグ同期)
  - [レスポンス形式（ReportItem）](#レスポンス形式reportitem)
- [クライアント側の変更方針](#クライアント側の変更方針)
  - [AppState インターフェース変更（DJ-3）](#appstate-インターフェース変更dj-3)
  - [AppStateProvider CRUD の修正](#appstateprovider-crud-の修正)
  - [accessToken の保持（DJ-4）](#accesstoken-の保持dj-4)
  - [fetchReports / fetchTags の修正](#fetchreports--fetchtags-の修正)
  - [削除対象のコード](#削除対象のコード)
- [エラーハンドリング](#エラーハンドリング)
  - [HTTPステータス体系](#httpステータス体系)
  - [クライアント側エラー処理フロー（DJ-3）](#クライアント側エラー処理フローdj-3)
- [ファイル構成（移行後）](#ファイル構成移行後)
- [テスト方針（DJ-5）](#テスト方針dj-5)
  - [既存 E2E テスト（維持）](#既存-e2e-テスト維持)
  - [API 統合テスト（新規追加 / 正式一覧）](#api-統合テスト新規追加--正式一覧)
- [移行フェーズ](#移行フェーズ)
  - [Phase 1: 基盤ファイル追加](#phase-1-基盤ファイル追加)
  - [Phase 2: APIルート追加 + API統合テスト](#phase-2-apiルート追加--api統合テスト)
  - [Phase 3: クライアント側の接続切り替え](#phase-3-クライアント側の接続切り替え)
  - [Phase 4: 認証エンドポイント統一（任意）](#phase-4-認証エンドポイント統一任意)
- [セキュリティ考慮](#セキュリティ考慮)
- [外部URL管理機能（API拡張）](#外部url管理機能api拡張)
  - [読み取り（GET /api/reports, GET /api/reports/[id]）](#読み取りget-apireports-get-apireportsid)
  - [書き込み](#書き込み)
  - [バリデーション（validateExternalUrls）](#バリデーションvalidateexternalurls)

## API 契約の正準（openapi.json）

- **契約の正準は [`openapi.json`](openapi.json)（OpenAPI 3.1）。** パス・リクエスト/レスポンスのスキーマ・ステータスコードの機械的な記述はこのファイルを唯一の真実とする。
- 生成元は `front/src/lib/schemas/report.ts` の zod スキーマ（`reportCreateSchema` / `reportPatchSchema` / `externalUrlInputSchema` / `reportItemSchema` / `tagListSchema` / `validationErrorSchema` / `errorSchema`、定数 `LIMITS`、関数 `normalizeTags`）。
- `front/` で `pnpm gen:openapi` を実行すると、`front/src/lib/openapi/document.ts`（`buildOpenApiDocument`）+ `front/scripts/gen-openapi.ts` 経由で `docs/openapi.json` が再生成される。
- 対象パス: `/api/reports`（GET/POST）, `/api/reports/{id}`（GET/PATCH/DELETE）, `/api/tags`（GET）, `/api/auth/admin`（GET）, `/api/auth/is-allowed`（POST）。
- **本書の役割**: 設計判断（DJ-1〜DJ-6）・補足・エンドポイント概要を担う。フィールド表やステータス羅列などの機械的な契約記述は openapi.json に集約し、本書からは重複を排除する。
- Swagger UI は導入していない（JSON を直接参照する）。

## 概要

現在のクライアント直接Supabase操作を、**APIルート経由のPrisma操作**に移行する。
認証認可・DB操作パターンは `youtube-my-collection` を踏襲する。

### 移行の目的

| 観点 | 現状（Before） | 移行後（After） |
|------|---------------|-----------------|
| DB操作 | クライアント → Supabase直接 | クライアント → APIルート → Prisma → DB |
| 認可(書き込み) | RLSのみ | **`requireAdmin()` + RLS** の二重防御 |
| バリデーション | クライアント側のみ | **クライアント + サーバー両方** |
| タグ同期 | AppStateProvider内で直接Supabase | APIルート内でPrismaトランザクション |
| 認可(認証確認) | `/api/auth/is-allowed` (POST) | `/api/auth/admin` (GET) に統一 |

### スコープ外

- AppStateProviderの内部分割（認証/CRUD責務分離）は別Issueで扱う
- UIコンポーネントの変更は最小限（fetch先の変更のみ）
- E2Eのlocalモードは維持する（APIルート呼び出し/localStorageの分岐は維持）
- DBマイグレーション禁止（Prismaは `db pull` のみ）

---

## 設計判断（レビュー指摘への回答）

### DJ-1. データ読み込みモデル: クライアント側全件保持を維持する

**決定: 現行の「全件取得 → クライアント側フィルタ/ページング」モデルをそのまま維持する。**

理由:
- 現行UIは AppStateProvider に全レポートを保持し、一覧のフィルタ/ページング・詳細画面のID解決・編集画面のデータ反映をすべてクライアント側で行っている（`ListPage.tsx:28`, `report/[id]/page.tsx:12`, `report/[id]/edit/page.tsx:19`）。
- server-driven pagination に切り替えると、詳細/編集の個別fetchと一覧のサーバーサイドフィルタリングが必要になり、UI層の変更が大きくなる。
- レポート件数は現状数百件規模を想定しており、全件取得でパフォーマンス問題は発生しない。

**APIへの影響:**
- `GET /api/reports` は **デフォルトで全件返却**する（`limit` パラメータのデフォルトは設けない）。
- `limit` / `offset` パラメータは将来のserver-driven pagination用に受け付けるが、省略時は全件を返す。
- クライアントは引数なしで `fetch('/api/reports')` を叩き、全件を受け取る。

**将来:**
- レポートが1000件を超える規模になった場合、server-driven paginationへの移行を検討する（別Issue）。

### DJ-2. タグの canonical form: `#` 付きで維持する

**決定: タグの canonical form は `#` 付き（例: `#AI`, `#Cloud`）を維持する。**

理由:
- 現行の全レイヤーが `#` 付きを前提に動作している:
  - `constants.tsx:25`: `TRENDING_TAGS = ['#AI', '#UIUX', '#Minimal', '#Nature']`
  - `useReportForm.ts:62`: 入力時に `#` を自動付与
  - `ReportTag.name` (DB): `#` 付きで格納済み
  - `DetailPage.tsx:89-91`: タグをそのまま表示（`{tag}` = `#AI`）
  - `FilterIndicator.tsx:30`: `#{tag}` で表示（# 付き前提）
  - `Sidebar.tsx:27`: `tag.replace(/^#/, '')` で比較用に剥がす
  - `ListPage.tsx:27`: 同上
  - `E2Eテスト (app.spec.ts:255)`: `#a`, `#b`, `#c` を期待
- `#` なしに寄せると、既存 `ReportTag.name` のデータ移行、UI/E2E全面修正が必要。

**APIへの影響:**
- `validation.ts` の `normalizeTags()` は `#` を剥がさない。配列入力はそのまま保持、文字列入力は `#` が無ければ付与する。
- APIレスポンスの `tags` フィールドは `#` 付き配列（例: `["#AI", "#Cloud"]`）。
- `toReportItem()` は `ReportTag.name` をそのまま返す（変換不要）。

### DJ-3. APIエラーのUI返却契約を定義する

**決定: Provider関数を `async` / result-returning に変更し、エラーを呼び出し元に返す。**

理由:
- 現行の `addReport` / `updateReport` / `deleteReport` は `void` 契約で、APIエラー時にUIが無反応になる。
- youtube-my-collection の `useVideoForm` が API応答のエラーを form に返すパターンを踏襲する。

**AppState インターフェース変更:**
```typescript
// 変更前
addReport: (report: Omit<ReportItem, 'id'>) => void;
updateReport: (id: string, updatedData: Partial<ReportItem>) => void;
deleteReport: (id: string) => void;

// 変更後
addReport: (report: Omit<ReportItem, 'id'>) => Promise<MutationResult>;
updateReport: (id: string, updatedData: Partial<ReportItem>) => Promise<MutationResult>;
deleteReport: (id: string) => Promise<MutationResult>;
```

**MutationResult 型:**
```typescript
type MutationResult =
  | { ok: true }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };
```

> `fieldErrors` は `Record<string, string>` とする（`ValidationErrors` ではない）。外部URLのエラーは `externalUrls.0.url` のような動的キーを取るため、固定キー型では表現できない。

**呼び出し元の変更:**

`useReportForm.ts`:
```typescript
// 変更前
const handleConfirmSubmit = () => {
  onSubmit(formData);
};

// 変更後
const handleConfirmSubmit = async () => {
  const result = await onSubmit(formData);
  if (!result.ok) {
    if (result.fieldErrors) {
      // フィールドごとのバリデーションエラーを表示
      setServerErrors(result.fieldErrors);
    } else if (result.status === 401 || result.status === 403) {
      // 認証/認可エラー → ログイン画面へ
      router.push('/login');
    } else {
      // その他のエラー → 汎用エラー表示
      setGeneralError(result.error);
    }
    return;
  }
  // 成功時は Provider 内で router.push 済み
};
```

`DetailPage.tsx`（削除）:
```typescript
// 変更前
const handleConfirmDelete = () => {
  onDelete(report.id);
};

// 変更後
const handleConfirmDelete = async () => {
  const result = await onDelete(report.id);
  if (!result.ok) {
    alert(result.error);  // または toast 表示
  }
};
```

**useReportForm の onSubmit 型変更:**
```typescript
// 変更前
onSubmit: (data: Omit<ReportItem, 'id'>) => void;

// 変更後
onSubmit: (data: Omit<ReportItem, 'id'>) => Promise<MutationResult>;
```

### DJ-4. accessToken のリロード時復元

**決定: 初回 `getSession()` でも `accessToken` を設定する。**

理由:
- 現行は `getSession()` で `currentUser` を復元するが `accessToken` は保持していない。
- リロード直後の POST/PATCH/DELETE が 401 になる余地がある。

**実装箇所（AppStateProvider 初期化）:**
```typescript
// 初回マウント時の init 内
const { data } = await supabase.auth.getSession();
const session = data.session ?? null;
if (session?.user) {
  const allowed = await checkAllowedEmail({
    email: session.user.email,
    accessToken: session.access_token,  // ← 既存
  });
  if (allowed) {
    setCurrentUser({ ... });
    setAccessToken(session.access_token);  // ← 追加: リロード復元
  }
}

// onAuthStateChange 内
if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
  setAccessToken(session?.access_token ?? null);  // ← トークン更新
}
if (event === 'SIGNED_OUT') {
  setAccessToken(null);
}
```

### DJ-5. APIルートの自動テスト方針

**決定: APIルート専用の統合テストスイートを追加する。**

理由:
- 既存 E2E は `NEXT_PUBLIC_AUTH_MODE=local` / `NEXT_PUBLIC_DATA_MODE=local` で動作し、APIルート/Prismaを通らない。
- 本番経路（supabase モード → APIルート → Prisma → DB）の回帰を CI で検知できない。

**テスト方針:**

| テスト種別 | 対象 | CI実行 | 環境 |
|-----------|------|--------|------|
| E2E (既存) | UI全体（localモード） | あり | `AUTH_MODE=local`, `DATA_MODE=local` |
| API統合テスト (新規) | APIルート単体 | あり | テスト用 Supabase 実 DB（DJ-8） |

**API統合テストの構成:**
- ファイル: `front/tests/api/reports.test.ts`, `front/tests/api/auth.test.ts`
- ツール: Playwright の `request` API（`APIRequestContext`）を使用
  - Playwright は既に導入済みのため追加依存なし
  - `request.get('/api/reports')` のように直接 API を叩ける
- 実行: `npm run test:api`（Playwright を `testDir: './tests/api'` で別プロジェクト起動）

**DB方針（確定 / DJ-8）:**

CI での API 統合テストは **テスト用 Supabase プロジェクト（実 DB）** を正とする。

- Playwright `APIRequestContext` で実際の Next.js dev サーバーに HTTP リクエストを送る構成のため、
  Prisma モックでは API ルート内の `prisma` インスタンスを差し替えられない。
- テスト用 Supabase プロジェクト（開発用と同一でも可）の `DATABASE_URL` を CI secrets に設定する。
- テスト実行前に seed → テスト → 終了後にクリーンアップ（`prisma.$transaction` で全テストデータ削除）。
- 認可テスト（API-004/005/011/012/013/014）は Supabase Auth のテストユーザーを使用する。
  - 管理者ユーザー: `ADMIN_EMAIL` に登録済みのメール
  - 非管理者ユーザー: `ADMIN_EMAIL` に登録されていないメール
  - トークンは `supabase.auth.signInWithPassword()` で取得
- API統合テストの導入は Phase 2 完了後に行い、Phase 3 のクライアント切り替え前にグリーンを確認する。

**テストケース一覧は本設計書「テスト方針」セクションの正式一覧（API-001〜API-014、14ケース）を正とする。**

### DJ-6. カテゴリの固定リストバリデーション

**決定: サーバー側バリデーションでもカテゴリ固定リストを検証する。**

理由:
- 要件定義（`docs/02-requirements-specification.md`）でカテゴリは固定リスト。
- 現行UIも `constants.tsx:24` の `CATEGORIES` 配列で固定。
- サーバー側がノーチェックだと、API直叩きで不正カテゴリが入る。

**実装:**
```typescript
// validation.ts
import { CATEGORIES } from '@/constants';

const ALLOWED_CATEGORIES = CATEGORIES;
// = ['Development', 'AI', 'Cloud', 'Linux', 'Container', 'Application', 'Program', 'Hobby']

// category バリデーション部分
if (!partial || hasField(input, 'category')) {
  const category = toStringValue(input.category);
  if (!category) {
    errors.category = 'カテゴリは必須です。';
  } else if (!ALLOWED_CATEGORIES.includes(category)) {
    errors.category = `カテゴリは次のいずれかです: ${ALLOWED_CATEGORIES.join(' / ')}`;
  } else {
    data.category = category;
  }
}
```

**CATEGORIES の参照方針（確定）:**

`validation.ts` から `@/constants` を直接 import する。分離は不要。

理由:
- `constants.tsx` は `'use client'` ディレクティブなし、React import なし、JSX なし。
- 中身は `DesignSystem` 型の import と純粋なデータ定義（`ESPRESSO_THEME`, `CATEGORIES`, `TRENDING_TAGS`, `AUTH_COOKIE_NAME`）のみ。
- `.tsx` 拡張子は `DesignSystem` 型参照のためだが、Next.js / TypeScript はサーバー側からの `.tsx` import を問題なく解決する。
- 実際に youtube-my-collection でも同様のパターン（`@/lib/constants` を共用）を採用しており、動作実績がある。

---

## 参照元: youtube-my-collection のパターン

### ファイル構成

```
youtube-my-collection/front/src/
├── lib/
│   ├── auth.ts            # クライアント側認証関数（signInWithGoogle, signOut）
│   ├── auth-server.ts     # サーバー側認可ミドルウェア（requireAdmin）
│   ├── db.ts              # Prismaクライアントシングルトン
│   ├── validation.ts      # サーバー+クライアント共用バリデーション
│   └── supabase/client.ts # Supabaseクライアント
├── hooks/
│   └── useAuth.ts         # 認証状態管理フック
├── app/api/
│   ├── auth/admin/route.ts       # 管理者判定 (GET)
│   ├── videos/route.ts           # 一覧取得(GET) + 新規作成(POST)
│   └── videos/[id]/route.ts      # 詳細取得(GET) + 更新(PATCH) + 削除(DELETE)
```

### 認可フロー

```
クライアント
  → fetch('/api/reports', { headers: { Authorization: 'Bearer <token>' } })
    → APIルート
      → requireAdmin(request, context)
        → Supabase Auth でトークン検証
        → ADMIN_EMAIL との照合（大文字小文字無視）
        → 失敗時: 401/403を返却
        → 成功時: Prisma でDB操作
      → レスポンス返却
```

### youtube-my-collection との差分

| 観点 | youtube-my-collection | md-view-my-collection（本設計） | 理由 |
|------|----------------------|-------------------------------|------|
| 一覧API | `limit=10` デフォルト（server-driven） | **デフォルト全件**（client-driven） | DJ-1: 現行UIが全件保持モデル |
| タグ形式 | `#` なし（`["AI", "React"]`） | **`#` 付き（`["#AI", "#React"]`）** | DJ-2: 既存データ/UI/E2Eとの互換 |
| ADMIN_EMAIL | 単一メール比較 | **カンマ区切り複数対応** | md-viewの既存仕様を維持 |
| CRUD戻り値 | hooks内でエラー処理 | **`MutationResult` を返却** | DJ-3: 呼び出し元でエラー表示 |
| カテゴリ検証 | なし（自由入力） | **固定リスト検証** | DJ-6: 要件定義の固定リスト |

---

## 新規ファイル設計

### 1. `front/src/lib/auth-server.ts` — サーバー側認可ミドルウェア

youtube-my-collection の `auth-server.ts` をベースに、以下のパフォーマンス改善を追加（#47）:
- Supabase クライアントをモジュールスコープで生成し warm invocation 間で再利用
- 認証済みトークンをインメモリキャッシュ（TTL 5分）し、同一トークンの2回目以降は Supabase HTTP 往復をスキップ
- `supabase.auth.getUser(token)` は明示的に JWT を渡すため、共有クライアントでも auth 状態の混線は起きない

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type RequireAdminResult =
  | { ok: true; email: string }
  | { ok: false; response: NextResponse };

// モジュールスコープで生成し warm invocation 間で再利用
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// 認証済みトークンのインメモリキャッシュ（warm invocation 間で存続）
const authCache = new Map<string, { email: string; expiresAt: number }>();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ログ出力時のメールマスク
const maskEmail = (value: string) => {
  if (!value) return '';
  const at = value.indexOf('@');
  if (at <= 1) return '***';
  return `${value[0]}***@${value.slice(at + 1)}`;
};

export const requireAdmin = async (
  request: NextRequest,
  context: string,
): Promise<RequireAdminResult> => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  if (!authHeader || !token) {
    console.warn(`[${context}] auth header missing`);
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const adminEmails = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // キャッシュヒット時は Supabase HTTP 往復をスキップ
  const cached = authCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    if (adminEmails.includes(cached.email.toLowerCase())) {
      return { ok: true, email: cached.email };
    }
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  const email = authData?.user?.email ?? '';
  const emailMatches = adminEmails.includes(email.toLowerCase());

  if (authError || adminEmails.length === 0 || !emailMatches) {
    console.warn(`[${context}] auth check failed`, {
      hasAuthError: Boolean(authError),
      emailMasked: maskEmail(email),
      emailMatches,
    });
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  // 検証成功をキャッシュ
  authCache.set(token, { email, expiresAt: Date.now() + AUTH_CACHE_TTL });

  // メモリリーク防止: 100件超で期限切れエントリを削除
  if (authCache.size > 100) {
    const now = Date.now();
    for (const [key, val] of authCache) {
      if (val.expiresAt <= now) authCache.delete(key);
    }
  }

  return { ok: true, email };
};
```

**youtube版との差分:**
- `ADMIN_EMAIL` をカンマ区切りで複数対応（md-viewの既存仕様を維持）
- Supabase クライアントをモジュールスコープで再利用（youtube版はリクエストごと生成）
- 認証トークンのインメモリキャッシュを追加（TTL 5分、最大100件で自動evict）

### 2. `front/src/lib/db.ts` — Prismaクライアントシングルトン

youtube-my-collection の `db.ts` をベースに、本番でもグローバル再利用する形に変更。
Vercel Serverless では同一プロセスが複数リクエストを処理する（warm invocation）ため、
リクエストごとに `new PrismaClient()` するとコールドスタートに近いコストが毎回発生する。
`globalThis` に保持することで warm invocation 時のDB再接続を削減する。

```typescript
import { PrismaClient } from '@prisma/client';

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

// 本番・開発とも globalThis に保持して warm invocation 間で再利用する
globalForPrisma.prisma = prisma;
```

### 3. `front/src/lib/schemas/` と `front/src/lib/validation.ts` — zod スキーマとアダプタ

**契約の正準は `front/src/lib/schemas/`（zod）。** `validation.ts` はそれを包む薄いアダプタである。

- **単一ソース**: `front/src/lib/schemas/report.ts` に API 契約を zod スキーマとして定義する（`reportCreateSchema` / `reportPatchSchema` / `externalUrlInputSchema` / `reportItemSchema` / `tagListSchema` / `validationErrorSchema` / `errorSchema`、定数 `LIMITS`、関数 `normalizeTags`）。タグは `#` 付きで維持（DJ-2）、カテゴリは固定リスト検証（DJ-6）。フィールドの型・上限・必須/任意の正準はこのスキーマで、`docs/openapi.json` へも反映される。
- **アダプタ**: `front/src/lib/validation.ts` は上記 zod スキーマを包み、既存の `{ data, errors }` 契約・日本語メッセージ・フィールドキーを維持する。export は `validateReportInput` / `validateExternalUrls` / `normalizeTags`。実装の本体ロジックは `lib/schemas/` 側にあり、本ファイルはエラー整形・後方互換のための薄いラッパーに徹する。
- **利用範囲（現状）**: バリデーションは**サーバー専用**で、reports の2ルート（`POST /api/reports` / `PATCH /api/reports/[id]`）のみが使用する。クライアント側では現状は呼び出していない（旧設計の「サーバー+クライアント共用」記述は実態に合わせて修正）。
- `validation.ts` の `{ data, errors }` 契約・`ValidationErrors` の各フィールドキー・日本語メッセージは Route Handler / hooks 側の既存呼び出しと互換を保つ。詳細なフィールド定義・上限値・エラースキーマは `lib/schemas/report.ts` および `docs/openapi.json` を参照する。

### 4. `front/src/types.ts` — 追加型定義

```typescript
// 既存の ReportItem, User, DesignSystem に追加

/** API書き込み操作の結果型（DJ-3） */
export type MutationResult =
  | { ok: true }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };
```

> 実装の `fieldErrors` は `Record<string, string>`。外部URLのエラー（`externalUrls.<i>.url` 等の動的キー）を扱うため固定キーの `ValidationErrors` 型ではない。

---

## APIルート設計（エンドポイント概要）

> **パス・リクエスト/レスポンスのスキーマ・ステータスコードの正準は [`openapi.json`](openapi.json)。** 以下は概要テーブルと設計上の補足のみを示す。フィールド表・ステータス羅列・スキーマ詳細は openapi.json を参照すること（本書では重複させない）。

| メソッド | パス | 概要 | 認証要否 |
|---------|------|------|---------|
| GET | `/api/auth/admin` | 管理者判定（boolean を返す。`{ isAdmin }`） | Bearer 必須 |
| POST | `/api/auth/is-allowed` | 許可メール判定（E2E互換用に維持） | localモード: body / supabaseモード: Bearer |
| GET | `/api/reports` | レポート一覧取得（DJ-1: デフォルト全件、`content` は除外） | 不要（公開閲覧） |
| POST | `/api/reports` | レポート新規作成（タグ・外部URL同期含む） | `requireAdmin()`（管理者必須） |
| GET | `/api/reports/{id}` | レポート詳細取得（`content` 実体を返す） | 不要（公開閲覧） |
| PATCH | `/api/reports/{id}` | レポート更新（partial / タグ・外部URL全件置換） | `requireAdmin()`（管理者必須） |
| DELETE | `/api/reports/{id}` | レポート削除（Cascade で関連削除） | `requireAdmin()`（管理者必須） |
| GET | `/api/tags` | タグ一覧取得（`#` 付き `string[]`） | 不要（公開閲覧） |

> 各エンドポイントのリクエスト/レスポンスフィールド・ステータスコード・エラースキーマは `docs/openapi.json` でカバーされる。ファイル配置は本書「ファイル構成（移行後）」セクションを参照。

以下は openapi.json に表現しきれない**設計判断・実装上の注意**を補足する。

### `GET /api/auth/admin` の設計補足

**ファイル:** `front/src/app/api/auth/admin/route.ts`

**`requireAdmin()` との使い分け（設計判断）:**
- `/api/auth/admin` は **boolean 判定専用**のエンドポイントであり、`requireAdmin()` を直接流用しない。
  - 非管理者は 403 ではなく **200 `{ isAdmin: false }`** を返す（クライアントが判定結果を受け取り自分でハンドリングする）。
  - `requireAdmin()` は CRUD エンドポイント（POST/PATCH/DELETE）の入り口で使い、非管理者を **403 で拒否**する。
- この区別は youtube-my-collection と同じ設計: `/api/auth/admin` は `supabase.auth.getUser(token)` + メール照合のみ、`requireAdmin()` は 401/403 でブロック。
- Supabase クライアントはモジュールスコープで生成し、warm invocation 間で再利用する。`supabase.auth.getUser(token)` は明示的に JWT を渡すため、共有 auth 状態の混線は起きない。

**localモード対応:**
- E2E互換のため、既存 `/api/auth/is-allowed` (POST) も当面維持する。
- 新規実装では `/api/auth/admin` (GET) を優先的に使用する。

### `GET /api/reports` の設計補足（DJ-1）

**ファイル:** `front/src/app/api/reports/route.ts`

- `limit` を省略した場合は全件を返却する（現行のクライアント側全件保持モデルに合わせる）。クエリパラメータ `limit` / `offset` の定義は openapi.json を参照。
- `limit` を指定した場合はレスポンスヘッダーに `x-total-count`, `x-limit`, `x-offset` を付与する。
- フィルタリング/ページングはクライアント側で行うため、サーバー側フィルタパラメータは設けない。
- 一覧は `select` で `content` を除外し `toReportListItem()` が `content: ''` を返す（ペイロード削減）。本文は `GET /api/reports/{id}` でのみ取得する。

**Prisma操作（全件取得時の例）:**
```typescript
const limit = parsedLimit;  // undefined = 全件
const offset = parsedOffset ?? 0;

const [totalCount, reports] = await prisma.$transaction([
  prisma.report.count(),
  prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    ...(limit !== undefined ? { take: limit } : {}),
    skip: offset,
    include: {
      ReportTagMapping: { include: { ReportTag: true } },
    },
  }),
]);
```

**備考（`GET /api/reports/{id}`）:** 現行UIは AppStateProvider の `reports` 配列から ID 解決するため、詳細エンドポイントは直接使わない。将来 server-driven 化した場合の詳細取得用に用意する。

### `POST /api/reports` / `PATCH /api/reports/[id]` のタグ同期

**処理フロー（共通）:**
1. `requireAdmin()` で認可チェック。
2. `validateReportInput()`（PATCH は `{ partial: true }`）でバリデーション（カテゴリ固定リスト含む）。契約の正準は `lib/schemas/`（zod）。
3. Prismaトランザクションで Report + ReportTag + ReportTagMapping（+ 外部URL）を同期。
4. 作成/更新済みレポートを返却。

**タグ同期（# 付き canonical form / トランザクション内）:**
```typescript
await prisma.$transaction(async (tx) => {
  const report = await tx.report.create({ data: { ... } });  // PATCH は update

  // PATCH 時、tags が送信された場合は既存マッピングを全削除してから再作成
  // await tx.reportTagMapping.deleteMany({ where: { reportId: id } });

  for (const tagName of data.tags) {
    await tx.reportTag.upsert({
      where: { name: tagName },           // 例: "#AI"
      create: { id: crypto.randomUUID(), name: tagName },
      update: {},
    });
  }

  const tagRecords = await tx.reportTag.findMany({ where: { name: { in: data.tags } } });
  await tx.reportTagMapping.createMany({
    data: tagRecords.map((tag) => ({
      id: crypto.randomUUID(),
      reportId: report.id,
      reportTagId: tag.id,
    })),
  });

  return report;
});
```

- **PATCH のタグ/外部URL**: `tags` / `externalUrls` が送信された場合のみ**全件置換**（`deleteMany` → `createMany`）する。
- **DELETE**: `ReportTagMapping` / `ExternalUrl` は ON DELETE CASCADE で自動削除される。
- ステータスコード（201/200/400/401/403/404）の正準は openapi.json を参照。

### レスポンス形式（ReportItem）

APIルートは `types.ts` の `ReportItem` と同じ形式で返却する（スキーマの正準は `reportItemSchema`（zod）/ openapi.json）。

- `content`: 詳細APIのみ実体。一覧API（`GET /api/reports`）では `''` を返す（ペイロード削減）。
- `tags`: `#` 付き配列（例: `["#AI", "#Cloud"]`）。
- `externalUrls`: `{ id, url, label }[]`。一覧・詳細の両方に含まれる（URL+ラベルのみで軽量）。詳細は本書「外部URL管理機能（API拡張）」セクションを参照。
- 日付フィールド（`publishDate` / `createdAt` / `updatedAt`）は ISO 8601 文字列。

**変換関数:** APIルート内で `toReportItem()` を定義し、Prismaの結果をフラット化する（`tags` は `ReportTagMapping.ReportTag.name` を `#` 付きのまま展開）。フィールドごとの型は openapi.json を参照。

---

## クライアント側の変更方針

### AppState インターフェース変更（DJ-3）

```typescript
// 変更前
interface AppState {
  // ...
  addReport: (report: Omit<ReportItem, 'id'>) => void;
  updateReport: (id: string, updatedData: Partial<ReportItem>) => void;
  deleteReport: (id: string) => void;
}

// 変更後
interface AppState {
  // ...
  accessToken: string | null;  // 追加（DJ-4）
  addReport: (report: Omit<ReportItem, 'id'>) => Promise<MutationResult>;
  updateReport: (id: string, updatedData: Partial<ReportItem>) => Promise<MutationResult>;
  deleteReport: (id: string) => Promise<MutationResult>;
}
```

### AppStateProvider CRUD の修正

**addReport の変更例:**
```typescript
// 変更後
const addReport = async (report: Omit<ReportItem, 'id'>): Promise<MutationResult> => {
  if (dataMode === 'local') {
    // localモードは従来通り
    const newReport = { ...report, id: Date.now().toString() };
    setReports((prev) => [newReport, ...prev]);
    router.push('/');
    return { ok: true };
  }

  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(report),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      status: res.status,
      error: body.error ?? 'Create failed',
      fieldErrors: body.errors,  // 400 のバリデーションエラー
    };
  }

  const created = (await res.json()) as ReportItem;
  setReports((prev) => [created, ...prev]);
  await fetchTags();
  router.push('/');
  return { ok: true };
};
```

### accessToken の保持（DJ-4）

```typescript
const [accessToken, setAccessToken] = useState<string | null>(null);

// 初回マウント時（getSession 復元）
useEffect(() => {
  const init = async () => {
    // ... fetchReports, fetchTags ...

    if (authMode !== 'local') {
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      if (session?.user) {
        const allowed = await checkAllowedEmail({
          email: session.user.email,
          accessToken: session.access_token,
        });
        if (allowed) {
          setCurrentUser({ ... });
          setAccessToken(session.access_token);  // ← リロード時復元
        }
      }
    }
    setIsHydrated(true);
  };
  void init();
}, []);

// onAuthStateChange
useEffect(() => {
  if (authMode === 'local') return;
  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    void (async () => {
      if (!session?.user) {
        setCurrentUser(null);
        setAccessToken(null);  // ← サインアウト時クリア
        return;
      }
      // ... allowed check ...
      setAccessToken(session.access_token);  // ← トークン更新
    })();
  });
  return () => subscription.subscription.unsubscribe();
}, []);
```

### fetchReports / fetchTags の修正

```typescript
// 変更前
const { data, error } = await supabase
  .from('Report')
  .select('*, ReportTagMapping(ReportTag(name))')
  .order('createdAt', { ascending: false });

// 変更後（DJ-1: 全件取得、引数なし）
const res = await fetch('/api/reports');
if (!res.ok) {
  console.error('[reports] fetch failed', res.status);
  setReports([]);
  return;
}
const data = (await res.json()) as ReportItem[];
setReports(data);
```

### 削除対象のコード

APIルート移行後に AppStateProvider から削除できるコード:

| 関数/型 | 理由 |
|---------|------|
| `ensureTags()` | APIルート内のPrismaトランザクションに移行 |
| `syncReportTags()` | 同上 |
| `toReportPayload()` | APIルート内のバリデーションに吸収 |
| `mapReportFromDb()` | APIルートがフラットなReportItemを返すため不要 |
| `ReportRow` / `ReportTagMappingRow` 型 | 同上 |
| `normalizeTagNames()` | `validation.ts` の `normalizeTags` に統一 |

---

## エラーハンドリング

youtube-my-collection のパターンを踏襲。

### HTTPステータス体系

| HTTPステータス | 意味 | レスポンス例 |
|---------------|------|-------------|
| 200 | 成功 | `ReportItem` or `{ ok: true }` |
| 201 | 作成成功 | `ReportItem` |
| 400 | バリデーションエラー | `{ errors: { title: '...', category: '...' } }` |
| 401 | 未認証 | `{ error: 'Unauthorized' }` |
| 403 | 権限不足 | `{ error: 'Forbidden' }` |
| 404 | 対象なし | `{ error: 'Not found' }` |
| 500 | サーバーエラー | `{ error: 'Internal server error' }` |

### クライアント側エラー処理フロー（DJ-3）

```
API レスポンス
  ├─ 200/201 → MutationResult { ok: true }
  ├─ 400     → MutationResult { ok: false, status: 400, fieldErrors: {...} }
  │            → useReportForm がフィールドごとにエラー表示
  ├─ 401/403 → MutationResult { ok: false, status: 401|403, error: '...' }
  │            → 呼び出し元が /login へリダイレクト
  ├─ 404     → MutationResult { ok: false, status: 404, error: 'Not found' }
  │            → 呼び出し元が alert/toast で通知
  └─ 500     → MutationResult { ok: false, status: 500, error: '...' }
               → 呼び出し元が alert/toast で通知
```

---

## ファイル構成（移行後）

```
front/src/
├── app/api/
│   ├── auth/
│   │   ├── admin/route.ts        # 【新規】管理者判定 (GET)
│   │   └── is-allowed/route.ts   # 【維持】E2E互換（localモード用）
│   ├── reports/
│   │   ├── route.ts              # 【新規】一覧(GET) + 新規作成(POST)
│   │   └── [id]/route.ts         # 【新規】詳細(GET) + 更新(PATCH) + 削除(DELETE)
│   └── tags/
│       └── route.ts              # 【新規】タグ一覧(GET)
├── lib/
│   ├── auth-server.ts            # 【新規】サーバー側認可ミドルウェア
│   ├── db.ts                     # 【新規】Prismaクライアントシングルトン
│   ├── schemas/report.ts         # 【新規】API契約の単一ソース（zod スキーマ / openapi.json 生成元）
│   ├── openapi/document.ts       # 【新規】buildOpenApiDocument（OpenAPI 3.1 生成）
│   ├── validation.ts             # 【新規】zod スキーマを包むサーバー専用アダプタ（{ data, errors } 契約維持）
│   └── supabaseClient.ts         # 【維持】認証用のみ（DB操作には使わない）
├── providers/
│   └── AppStateProvider.tsx      # 【修正】CRUD → fetch APIルート、MutationResult返却、accessToken管理
├── hooks/
│   ├── useAppState.ts            # 【維持】
│   └── useReportForm.ts          # 【修正】onSubmit を async に、サーバーエラー表示追加
├── components/pages/
│   └── DetailPage.tsx            # 【修正】onDelete を async に、エラー表示追加
└── types.ts                      # 【修正】MutationResult 型追加
```

---

## テスト方針（DJ-5）

### 既存 E2E テスト（維持）

- `NEXT_PUBLIC_AUTH_MODE=local` / `NEXT_PUBLIC_DATA_MODE=local` で動作
- localStorage を seed、APIルート/Prismaは通らない
- 既存 25 ケース（TC-001〜TC-025）は変更なし

### API 統合テスト（新規追加 / 正式一覧）

- ファイル: `front/tests/api/*.test.ts`
- ツール: Playwright `APIRequestContext`（追加依存なし）
- 実行: `npm run test:api`
- CI: GitHub Actions で E2E とは別ジョブで実行
- DB: テスト用 Supabase 実 DB（DJ-8 で確定）

| ID | メソッド | パス | ケース | 期待 |
|----|---------|------|--------|------|
| API-001 | GET | /api/reports | 全件取得 | 200 + ReportItem[] |
| API-002 | GET | /api/reports/:id | 存在するID | 200 + ReportItem |
| API-003 | GET | /api/reports/:id | 存在しないID | 404 |
| API-004 | POST | /api/reports | トークンなし | 401 |
| API-005 | POST | /api/reports | 管理者でないトークン | 403 |
| API-006 | POST | /api/reports | バリデーションエラー（タイトル空） | 400 + errors |
| API-007 | POST | /api/reports | 不正カテゴリ | 400 + errors.category |
| API-008 | POST | /api/reports | 正常作成 | 201 + ReportItem（tags は # 付き） |
| API-009 | PATCH | /api/reports/:id | 正常更新 | 200 + ReportItem |
| API-010 | DELETE | /api/reports/:id | 正常削除 | 200 + { ok: true } |
| API-011 | GET | /api/tags | タグ一覧取得 | 200 + string[]（# 付き） |
| API-012 | GET | /api/auth/admin | 管理者トークン | 200 + { isAdmin: true } |
| API-013 | GET | /api/auth/admin | トークンなし | 401 + { isAdmin: false } |
| API-014 | GET | /api/auth/admin | 非管理者トークン | 200 + { isAdmin: false } |

**導入タイミング:** Phase 2 完了後、Phase 3 のクライアント切り替え前。

---

## 移行フェーズ

### Phase 1: 基盤ファイル追加
- `lib/auth-server.ts` 作成
- `lib/db.ts` 作成
- `lib/validation.ts` 作成
- `types.ts` に `MutationResult` 追加
- `constants.tsx` の `CATEGORIES` を `validation.ts` から直接 import（DJ-6: 分離不要を確認済み）
- ビルド確認

### Phase 2: APIルート追加 + API統合テスト
- `api/auth/admin/route.ts` 作成
- `api/reports/route.ts` 作成（GET: 全件デフォルト + POST）
- `api/reports/[id]/route.ts` 作成（GET + PATCH + DELETE）
- `api/tags/route.ts` 作成（GET）
- API統合テスト作成・実行（API-001〜API-014）

### Phase 3: クライアント側の接続切り替え
- AppStateProvider: `accessToken` 状態追加（DJ-4: 初回getSession + onAuthStateChange）
- AppStateProvider: CRUD を fetch APIルートに変更（`MutationResult` 返却）
- `useReportForm.ts`: `onSubmit` を `async` に変更、サーバーエラー表示追加
- `DetailPage.tsx`: `onDelete` を `async` に変更、エラー表示追加
- fetchReports / fetchTags を APIルート経由に変更（全件取得）
- 不要コード削除（ensureTags, syncReportTags, mapReportFromDb等）
- E2Eテスト全パス確認（localモード）
- API統合テスト全パス確認
- ビルド確認

### Phase 4: 認証エンドポイント統一（任意）
- `/api/auth/is-allowed` の呼び出しを `/api/auth/admin` に切り替え
- localモードの互換性を確認
- E2Eテスト全パス確認

---

## セキュリティ考慮

- **二重防御**: `requireAdmin()` (サーバー) + RLS (DB) の両方で書き込みを制御
- **Prisma接続**: `DATABASE_URL` は `postgres` ロール（RLSバイパス）のため、`requireAdmin()` が必須
- **トークン検証**: Supabase Auth の `getUser(token)` で JWT を検証
- **メールマスク**: ログ出力時にメールアドレスをマスク（`t***@example.com`）
- **バリデーション**: クライアント + サーバー両方で実施し、サーバー側が権威
- **カテゴリ固定リスト**: サーバー側で CATEGORIES 照合（API直叩きによる不正値防止）
- **エラー情報の制限**: エラーレスポンスに内部情報（スタックトレース等）を含めない
- **accessToken管理**: 初回getSession + onAuthStateChange の両方で復元・更新し、リロード後も書き込み可能を保証

---

## 外部URL管理機能（API拡張）

ExternalUrl は常に Report と一緒に操作されるため、専用エンドポイントは設けず既存 `/api/reports` を拡張する。

### 読み取り（GET /api/reports, GET /api/reports/[id]）

- Prisma `include` に `ExternalUrl` を追加し、各レポートに `externalUrls: { id, url, label }[]` を含める。
- `externalUrls` は URL+ラベルのみで軽量なため、一覧APIにも含める（`content` とは異なり除外しない）。

### 書き込み

- **POST /api/reports**: body に `externalUrls?: { url: string; label?: string }[]` を受け付け、トランザクション内で Report 作成後に bulk insert（`createMany`）。
- **PATCH /api/reports/[id]**: body の `externalUrls` で**全件置換**（`deleteMany` → `createMany`）。TagMapping 同期と同じ全件置換パターン。
- **DELETE /api/reports/[id]**: 変更なし（ON DELETE CASCADE で自動削除）。

### バリデーション（validateExternalUrls）

- `url`: 必須、`http://` または `https://` で始まる（`/^https?:\/\//`）。
- `label`: 任意、最大200文字。
- エラーは行単位の dot-notation キー（`externalUrls.<i>.url` / `externalUrls.<i>.label`）で `fieldErrors`（`Record<string, string>`）に返す。
- 空行（URL空）は無視される。

> データモデル・RLS は `docs/05-data-specification.md`、機能仕様は `docs/03-functional-specification.md`、コンポーネント設計は `docs/09-architecture-specification.md` を参照。
