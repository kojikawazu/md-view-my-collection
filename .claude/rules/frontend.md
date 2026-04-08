---
description: Next.js (App Router) フロントエンド設計・コンポーネント規約
globs: "front/src/components/**,front/src/app/**,front/src/hooks/**,front/src/lib/**"
---

# フロントエンドルール（Next.js App Router）

## コンポーネント設計

アトミックデザインを採用:

| レイヤー | 配置 | 説明 |
|---|---|---|
| **Atoms** | `components/atoms/` | Button, Input, Badge 等の最小単位 |
| **Molecules** | `components/molecules/` | FormField, PaginationNav 等の組み合わせ |
| **Organisms** | `components/organisms/` | Header, Sidebar, ReportMarkdown 等の機能単位 |
| **Pages** | `components/pages/` | ListPage, DetailPage, FormPage 等のページ実装 |

- 各ディレクトリに `index.ts` (barrel export) を維持する。

## サーバー/クライアント分離

- `page.tsx` — サーバーコンポーネント（データ取得・SEO・props 受け渡し）
- `client.tsx` — クライアントコンポーネント（インタラクション・状態管理）
- server-first を基本とする。

## ロジック分離

- クライアントコンポーネントのロジックはカスタムフック（`hooks/`）に切り出す。コンポーネントは UI 描画に専念する。
- サーバーコンポーネントのデータ取得は `page.tsx` や `lib/` 内のサーバー関数で行う。

## インポート

- `@/*` パスエイリアスを使用する（相対パスの深いネストを避ける）。

## テスト

- E2E: Playwright（`front/tests/e2e/` ディレクトリ）
- ユニットテスト: `front/src/<module>/__tests__/` ディレクトリ
- Base URL: `http://localhost:3000`
