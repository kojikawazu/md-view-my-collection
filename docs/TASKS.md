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
- [x] `base/` を `front/` にコピーして実装用ディレクトリを用意（開発開始時のみ）
- [x] `base/` を読み取り専用扱いとする運用ルールを整備

## フロントエンド実装（front/）
- [x] 画面ルーティングを維持（一覧/詳細/新規/編集/ログイン）
- [x] UI要件に沿って画面を実装/調整
- [x] ログイン/ログアウト動作を実装
- [x] 投稿/編集/削除の確認モーダル動作を実装
- [x] Markdown簡易レンダリングを実装（要サニタイズ方針）
- [x] 重要操作のログ出力を実装（投稿/編集/削除/ログイン）
- [x] 初期ダミーデータの表示を停止（Supabaseデータのみ表示）
- [x] 初期表示をフェードで切り替えるローディング画面を追加

## データ/永続化
- [x] 保存先の確定（Supabase等）
- [x] Report/Userスキーマを確定
- [x] 投稿/編集/削除のデータ連携
- [x] Prismaスキーマは既存テーブルを `prisma db pull` で取得し、新規設計は `schema.prisma` に記述（マイグレーション禁止）

## テスト
- [x] E2Eテスト基盤を導入
- [x] 主要導線のE2Eテスト作成（一覧/詳細/投稿/編集/削除/ログイン）
- [x] E2Eテスト仕様（正常/準正常/異常）を定義（`docs/04.e2e-cases.md`）
- [x] GitHub ActionsでE2E自動実行を追加

## デプロイ/運用
- [x] Vercelプロジェクトを作成
- [x] Vercel自動デプロイを設定（mainのみ、プレビューなし）
- [x] 本番環境変数を整備（必要が出た場合のみ）
- [x] 本番動作確認（Google OAuth/初期表示）

## 残タスク
- [x] allowedDevOrigins 警告の対応
- [x] Supabase DB連携の動作確認（実データCRUD）
- [ ] 監査/ログの強化（必要なら）
- [x] Google OAuthのリダイレクト固定（`NEXT_PUBLIC_SITE_URL` を使用）

## 開発再開メモ
- [x] `front/` のNext.js再構築後、baseレイアウトの反映を開始する。
- [x] Prettier設定を追加（package.jsonのscript/依存追加、.prettierrc/.prettierignore）。
- [x] `front/src/types.ts` を作成してbaseの型を移植。
- [x] `front/src/constants.tsx` を作成してbaseのテーマ/初期データを移植。
- [x] `front/src/components/` と `front/src/app/` に画面/部品を移植する。
- [x] ルーティング: `/`, `/report/[id]`, `/report/new`, `/report/[id]/edit`, `/login` をApp Routerで構成。
- [x] SupabaseログインにGoogle OAuthを追加（localはE2E用に維持）
