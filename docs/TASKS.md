# Tasks

## 要件定義
- [x] 最新UIレイアウト要求を作成（`docs/02.ui-layout.md`）
- [x] 要件定義ドラフトを作成（`docs/03.requirements.md`）
- [x] コーディング規約を明文化（`docs/03.requirements.md`）
- [x] E2Eツールを選定（Playwright）
- [x] 認証方式を決定（Supabase Auth）
- [x] Markdownサニタイズ方針を確定（react-markdown/remark-gfm/rehype-sanitize）
- [x] ログ方針を確定（本番/開発ともconsole、セキュリティ配慮）

## リポジトリ構成
- [ ] `base/` を `front/` にコピーして実装用ディレクトリを用意（開発開始時のみ）
- [ ] `base/` を読み取り専用扱いとする運用ルールを整備

## フロントエンド実装（front/）
- [ ] 画面ルーティングを維持（一覧/詳細/新規/編集/ログイン）
- [ ] UI要件に沿って画面を実装/調整
- [x] ログイン/ログアウト動作を実装
- [x] 投稿/編集/削除の確認モーダル動作を実装
- [x] Markdown簡易レンダリングを実装（要サニタイズ方針）
- [x] 重要操作のログ出力を実装（投稿/編集/削除/ログイン）

## データ/永続化
- [ ] 保存先の確定（Supabase等）
- [ ] Report/Userスキーマを確定
- [ ] 投稿/編集/削除のデータ連携
- [ ] Prismaスキーマは `prisma db pull` のみで取得（設計は変更しない）

## テスト
- [x] E2Eテスト基盤を導入
- [x] 主要導線のE2Eテスト作成（一覧/詳細/投稿/編集/削除/ログイン）
- [x] E2Eテスト仕様（正常/準正常/異常）を定義（`docs/04.e2e-cases.md`）

## デプロイ/運用
- [ ] Vercelプロジェクトを作成
- [ ] Vercel自動デプロイを設定（mainのみ、プレビューなし）
- [ ] 本番環境変数を整備（必要が出た場合のみ）

## 開発再開メモ
- [ ] `front/` のNext.js再構築後、baseレイアウトの反映を開始する。
- [ ] Prettier設定を追加（package.jsonのscript/依存追加、.prettierrc/.prettierignore）。
- [ ] `front/src/types.ts` を作成してbaseの型を移植。
- [ ] `front/src/constants.tsx` を作成してbaseのテーマ/初期データを移植。
- [ ] `front/src/components/` と `front/src/app/` に画面/部品を移植する。
- [ ] ルーティング: `/`, `/report/[id]`, `/report/new`, `/report/[id]/edit`, `/login` をApp Routerで構成。
