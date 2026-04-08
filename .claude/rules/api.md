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
│   ├── admin/route.ts      # 管理者判定（ADMIN_EMAIL照合）
│   └── is-allowed/route.ts # ローカルモード認証（E2E専用）
├── reports/
│   ├── route.ts            # GET（一覧）/ POST（新規作成）
│   └── [id]/route.ts       # GET（詳細）/ PATCH（更新）/ DELETE（削除）
└── tags/route.ts           # GET（タグ一覧）
```

## 共通方針

- RESTful 設計（リソース指向エンドポイント）
- レスポンス形式: JSON（`NextResponse.json()`）
- 入力バリデーションは Route Handler 内で実施（`lib/validation.ts` を使用）
- エラー時は適切な HTTP ステータスコード（400/401/403/404/500）で返す
- 認証は `lib/auth-server.ts` の `requireAdmin()` を使用する
- DB アクセスは `lib/db.ts` の Prisma インスタンスを使用する（シングルトン）

## キャッシュ戦略

- GET API（reports / tags / reports/[id]）: `s-maxage=60, stale-while-revalidate=300` を設定
- POST / PATCH / DELETE: キャッシュなし（mutation後はクライアント側で再取得）
