# md-view-my-collection

Markdownレポートの保存・閲覧UIを提供するNext.jsアプリです。要件・UI・E2E仕様は `docs/` に集約しています。

## 構成
- `docs/` 要件定義・UI仕様・E2E仕様・タスク管理
- `base/` 参照用の原本（**読み取り専用**）
- `front/` 実装ディレクトリ（Next.js App Router）

## 開発セットアップ
```
cd front
npm install
npm run dev
```

## ビルド
```
cd front
npm run build
npm run start
```

## E2E（Playwright）
```
cd front
npx playwright install
npm run test:e2e
```

E2Eは `NEXT_PUBLIC_AUTH_MODE=local` / `NEXT_PUBLIC_DATA_MODE=local` を前提に動作します（`front/playwright.config.ts` で設定）。

## 環境変数（本番）
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`（Google OAuthリダイレクト用）

## ドキュメント
- `docs/README.md` ドキュメントの目次
- `docs/01.pre-requirements.md` 初期要求整理（読み取り専用）
- `docs/02.ui-layout.md` 最新UIレイアウト要求
- `docs/03.requirements.md` 要件定義（機能/非機能/規約）
- `docs/04.e2e-cases.md` E2Eテスト仕様（厳密版）
- `docs/TASKS.md` タスク一覧

## 注意
- `base/` は変更禁止。実装は必ず `front/` のみ。
- Vercelは `main` ブランチのみ本番デプロイ（プレビュー無し）。
