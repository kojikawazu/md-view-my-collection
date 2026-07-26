---
description: Next.js BFF（Route Handlers）設計・API ルール
globs: "front/src/app/api/**"
---

# API ルール（Next.js BFF / Route Handlers）

## 設計方針

- Next.js App Router の Route Handlers を BFF として使用する。
- BFF 層はフロントエンドとバックエンドの橋渡しに徹する。薄く保つ。
- 認証チェック・DB操作・バリデーションを担当する。

## ディレクトリ構成

```text
front/src/app/api/
├── auth/
│   ├── admin/route.ts      # 管理者判定（GET / ADMIN_EMAIL照合, isAdmin を返す）
│   └── is-allowed/route.ts # 許可メール判定（POST）。localモードは body.email、supabaseモードは Bearer トークン検証 + メール照合
├── reports/
│   ├── route.ts            # GET（一覧）/ POST（新規作成）
│   └── [id]/route.ts       # GET（詳細）/ PATCH（更新）/ DELETE（削除）
├── tags/route.ts           # GET（タグ一覧）
└── openapi/route.ts        # GET（OpenAPI ドキュメント / 管理者のみ `requireAdmin`）。`/docs` の Swagger UI が読み込む
```

## レスポンス整形（Prisma の行オブジェクトを素通ししない）

- **Prisma が返した行オブジェクトをそのまま `NextResponse.json()` に流さない**。BFF の責務は「**この画面に必要なものだけ**を返す」ことであり、パススルーは責務放棄にあたる。
- **公開してよいフィールドだけを厳選**して返す（内部 ID・監査カラム・他ユーザー情報を漏らさない）。**ブラウザに届いた時点で、画面に表示していなくてもユーザーは全て閲覧できる**。
- 変換は明示的に行う。**Prisma の `select` で取得列を絞り、さらに `lib/schemas/` の Zod スキーマ（`.pick()` / `parse`）で返す値を確定する**。スプレッド（`{ ...row, extra }`）で組み立てない — **DB にカラムが増えた瞬間、自動的に公開される**。
- エラーレスポンスも整形する。**Prisma のエラーメッセージ・SQL・スタックトレースをそのまま返さない**（`error-handling.md` に従い、`{ error: string }` のクライアント向けメッセージに変換する）。
- **画面単位のレスポンス型を定義**し、その形に合わせて整形する（`Report` + `ReportTagMapping` + `ExternalUrl` の集約など）。
- **変換は Route Handler に閉じる。フロント側で再変換しない**（変換層を二重に置かない。`frontend.md`「型の扱い」と対になる規定）。
- **`app/api/` から UI 層（`components/` / `hooks/`）を import しない**。API はサーバー側の層であり、UI に依存してはならない。
- **理由**: 過剰公開（over-fetching / 情報漏洩）の防止、DB スキーマ変更がクライアント契約に直接漏れない疎結合化、転送量の削減。

## バリデーションの二重定義禁止

同じ入力ルールを複数レイヤで別々に書かない。担当レイヤを 1 つに固定する。

| 検証の種類 | 担当 |
|---|---|
| **形式・構文**（型・必須・文字数・列挙値） | Route Handler で **Zod**（`lib/schemas/`）。ここが唯一の定義 |
| **業務ルール**（カテゴリの固定リスト・重複禁止等） | Route Handler（必要なら DB 参照を伴う） |
| **DB 制約**（NOT NULL・UNIQUE・FK） | DB スキーマ。アプリ側で肩代わりして再実装しない |

- クライアント側の検証は**信頼境界が違うため重複してよい**が、**スキーマ自体は `lib/schemas/` を共有**する（`duplication.md`）。
- **リクエストの生オブジェクトを Prisma にそのまま渡さない**（マスアサインメント）。Zod で `parse` した値から、**書き込むフィールドを明示的に指定**する。

## 共通方針

- RESTful 設計（リソース指向エンドポイント）
- レスポンス形式: JSON（`NextResponse.json()`）
- 入力バリデーションは Route Handler 内で実施。スキーマの正準は `lib/schemas/`（zod）。`lib/validation.ts` はそれを包むアダプタ（`{ data, errors }` 契約を維持）
- エラー時は適切な HTTP ステータスコード（400/401/403/404/500）で返す
- 認証は `lib/auth-server.ts` の `requireAdmin()` を使用する
- DB アクセスは `lib/db.ts` の Prisma インスタンスを使用する（シングルトン）

## API 契約（OpenAPI）

- リクエスト/レスポンスの契約は `lib/schemas/`（zod）を単一ソースとし、`pnpm gen:openapi` で `docs/openapi.json`（OpenAPI 3.1）を生成する。
- スキーマ・検証ルールを変更したら `pnpm gen:openapi` を実行し、生成物をコミットする。
- 手書きのエンドポイント仕様は `docs/openapi.json` と重複させない（正準は生成物）。
- ブラウザ閲覧用に `/docs`（Swagger UI・**管理者のみ**）を提供する。スペックは `/api/openapi`（`requireAdmin`）から Bearer トークン付きで取得する。

## キャッシュ戦略

- GET API（reports / tags / reports/[id]）: `s-maxage=60, stale-while-revalidate=300` を設定
- POST / PATCH / DELETE: キャッシュなし（mutation後はクライアント側で再取得）
