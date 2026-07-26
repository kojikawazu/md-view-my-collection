---
description: Next.js (App Router) フロントエンド設計・コンポーネント規約
globs: "front/src/components/**,front/src/app/**,front/src/hooks/**,front/src/lib/**,front/src/providers/**"
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
- サーバーコンポーネントのデータ取得は `page.tsx` から `repositories/` の関数を呼んで行う（hooks は使用しない）。
- `page.tsx` は**データ取得と合成の場**。「薄く」する必要はないが、**ビジネスロジックは置かない**（データ取得は `repositories/`、計算・整形は `lib/` の純粋関数へ）。

## 状態管理・Context

- **Context は cross-cutting かつ低頻度変更**の関心事に限定する: 認証/セッション、テーマ、ローディング表示、feature flag。
- 頻繁に変わる状態を Context に載せない（**value が変わるたび配下のコンシューマが再レンダリングされる**）。
- Context は関心事ごとに分割し、provider の value は memo 化する。本プロジェクトが `AppStateProvider`（認証・レポート CRUD）と `LoadingContext`（ローディング表示）を分けているのはこの理由による。
- **Next.js 固有**: Context の provider は Client Component（`"use client"`）必須。Server Component は Context を参照できないため、**provider は必要な client 境界に置き、ツリー全体を包まない**。
- **Context value・カスタムフックの戻り値は型を先に定義し、各メンバーにコメントを付ける**（インラインのオブジェクトリテラルで済ませない）。これらは定義ファイルを開かずに使われるため、コメントが唯一の説明になる。詳細は `jsdoc.md`「状態・ロジック層のコメント」に従う。
- コンポーネント内に閉じた `useState`・ハンドラ関数は一律必須にしない（「なぜ」が非自明なときのみ）。

> 本プロジェクトはサーバー状態管理ライブラリ（React Query / SWR）と store ライブラリ（Zustand 等）を採用していない。レポートは `AppStateProvider` が全件保持する方針で、その判断理由は `docs/07-api-specification.md` の DJ-1 に記録されている。導入を検討する場合は先にそちらを更新すること。

## 関心別にディレクトリを切る

`types/` `constants/` `schemas/` `repositories/` は**それぞれ独立したディレクトリ**として `src/` 直下に置く。いずれも**単一ファイルにまとめない**（`src/types.ts` / `lib/validation.ts` のような形は禁止）。詳細は `typescript.md`「型定義の配置」「定数の配置」に従う。

| ディレクトリ | 置くもの | 置かないもの |
|---|---|---|
| `types/` | 2 箇所以上から参照される型 | 値・ロジック |
| `constants/` | 全環境で不変な値 | 環境変数・型を導出する定数（`types/` 側へ） |
| `schemas/` | Zod スキーマ（フォーム・API 契約の検証） | 検証を伴わない型定義（`types/` へ） |
| `repositories/` | **API アクセス**（`fetch` / API クライアント呼び出し） | UI・画面都合の整形・業務判断 |
| `lib/` | **通信を持たない純粋ユーティリティ** | API アクセス（`repositories/` へ）・定数・型 |

- **`fetch` を書いてよいのは `repositories/` だけ**。コンポーネント・hooks・`lib/` から直接叩かない。呼び出し口を 1 箇所に閉じることで、認証ヘッダ・エラー処理・リトライの実装が散らばらない。
- ディレクトリ名は**複数形で統一**する（`types` / `constants` / `schemas` / `repositories`）。

> **未移行（Issue #164）**: 現行は `fetch` が `providers/AppStateProvider.tsx` / `hooks/useReport.ts` / `app/docs/page.tsx` に散在し、Zod スキーマは `lib/schemas/` にある。本節はルールが先行しており、移行は #164 で対応する。**新規のデータ取得は移行を待たず `repositories/` に置いてよい**。

## レイヤ依存の一方向ルール

**依存は上位から下位への一方向のみ**。下位レイヤが上位レイヤを import してはならない。

```text
app  →  components  →  hooks  →  repositories  →  lib / schemas  →  types / constants
（ルーティング・合成）（表示） （ロジック）（APIアクセス）（純粋関数・検証）  （最下層）
```

| レイヤ | import してよい | import 禁止 |
|---|---|---|
| `app/` | `components/`, `hooks/`, `repositories/`, `lib/`, `schemas/`, `providers/`, `types`, `constants` | （なし。app は誰からも参照されない） |
| `components/` | 下位の `components/`, `hooks/`, `lib/`, `types`, `constants` | **`app/`**（ページ固有の型・定数を含む）, **`repositories/`**（データ取得は Server Component か `hooks/` 経由） |
| `hooks/` | `repositories/`, `lib/`, `schemas/`, `types`, `constants` | **`app/`**, **`components/`**（JSX を返さない） |
| `repositories/` | `lib/`, `schemas/`, `types`, `constants` | **`app/`**, **`components/`**, **`hooks/`** |
| `lib/` `schemas/` | `types`, `constants` | 上位レイヤすべて（**`lib/` は通信もしない**） |
| `types/` `constants/` | （原則どこにも依存しない） | 上位レイヤすべて |

- **アトミックデザイン内も一方向**にする。`atoms/` は `molecules/` `organisms/` `pages/` を import しない。汎用度の高いものほど下位（`atoms → molecules → organisms → pages` の向きにのみ依存する）。
- **`app/api/`（Route Handlers）から `components/` や `hooks/` を import しない**。API はサーバー側の層であり、UI 層に依存してはならない（`api.md` 参照）。
- **サーバー専用モジュールを Client Component から import しない**。特に `lib/db.ts`（Prisma）・`lib/auth-server.ts` は `ADMIN_EMAIL` / `DATABASE_URL` を扱うため、**クライアントに引き込むとシークレットがバンドルに混入する**（`security.md`）。両モジュールは先頭で **`import 'server-only'`** しており、Client Component から import されるとビルドが失敗する。サーバー専用モジュールを新設する場合も同様に付ける。
- **`hooks/` は JSX を返さない**。返したくなったらそれはコンポーネントであり、`components/` に置く。

禁止例:

- `components/organisms/Header.tsx` が `app/report/page.tsx` の型・定数を import する
- `hooks/useReports.ts` が `components/` を import する
- 同一レイヤ間の**相互依存（循環）**（例: `A.tsx` ⇄ `B.tsx` が互いを import）

### 逆流したくなったら「共通化」で解決する

| 逆流したい理由 | 正しい解き方 |
|---|---|
| 上位の型・定数を下位でも使いたい | その型・定数を **`types.ts` / `constants.ts` へ移動**し、上下双方がそこを参照する |
| 上位のロジックを下位でも使いたい | 共通処理を**下位の `hooks/` または `lib/` の純粋関数へ抽出**し、双方から呼ぶ |
| 下位から上位の状態を変えたい | **呼ばない**。**props でコールバックを受け取る**（イベントは上へ、データは下へ） |
| 子が親のレイアウトを知りたい | 知らせない。**props / children で親が渡す**（子は自分の見た目だけに責任を持つ） |

**レビュー観点**: import 文の向きを見る。下位レイヤのファイルに上位レイヤ（`app/` / `components/`）へのパスが現れていたら指摘する。Client Component がサーバー専用モジュールを引き込んでいないか。

## 型の扱い（API の形を画面に持ち込まない）

**API のレスポンス型と、画面が使う型を分ける。**

| 種類 | 役割 | 置き場所 |
|---|---|---|
| **API 契約の型** | Route Handlers が返す形。サーバー側の都合で変わる | `schemas/`（zod）から `z.infer` で導出。手書きで再定義しない |
| **ビューモデル** | 画面が必要とする形。UI 要件で変わる | `types/`、単一画面用なら該当コンポーネントにコロケーション |

本プロジェクトは **Route Handlers を BFF として持つ一体型**のため、**変換は BFF（`app/api/`）に閉じる**。API は画面単位のレスポンス型を定義してその形に整形して返し、**フロント側で再変換しない**（変換層を二重に置かない。`api.md`「レスポンス整形」と対になる規定）。

- **理由**: DB スキーマのカラム名変更が画面のあちこちに波及するのを防ぐ。API 契約とビューは**変わる理由が違う**（`duplication.md`「層をまたぐ型は共通化しない」）。
- 表示専用の整形（日付フォーマット・カテゴリ名の解決）は**コンポーネント側**で行い、**API 契約の型に表示都合のフィールドを足さない**。
- ただし**両者が完全に一致し、変換が恒久的に無意味な場合は同じ型を使ってよい**（早すぎる抽象化を避ける）。**表示都合の差が出た時点で分ける**。

## バリデーション

- スキーマの正準は **`schemas/`（zod）**。`typescript.md`「スキーマバリデーションは Zod に統一する」に従い、`yup` 等と**混在させない**。
- **スキーマを単一の真実とする**。フォームの型は `z.infer<typeof schema>` で導出し、同じ形を手書きしない。
- **クライアント検証は UX のためのものであり、セキュリティ担保ではない**。Route Handler 側で必ず検証する（信頼境界が違うため、この重複は必要 — `duplication.md`）。
- **Server Action を導入する場合、引数も必ずサーバー側で `parse` する**。Server Action は公開エンドポイントと同等であり、フォームを経由せず直接呼び出せる。
- 同じ入力ルールなら、**Route Handler と同じ Zod スキーマを共有**する（`schemas/` を双方から参照）。制約値だけでも定数で共有する。

## インポート

- `@/*` パスエイリアスを使用する（相対パスの深いネストを避ける）。

## テスト

- E2E: Playwright（`front/tests/e2e/` ディレクトリ）
- ユニットテスト: `front/src/<module>/__tests__/` ディレクトリ
- Base URL: `http://localhost:3000`
