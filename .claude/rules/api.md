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

```
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
