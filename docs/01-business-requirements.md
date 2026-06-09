# Markdownレポート保存＆ビューア構想

※ こちらは要求をまとめたものです。
  要件定義前のものです。

## 目的
- 「これいいな」と思ったレポートやスライド・記事などを **流れて消えるもの** にせず、あとで見返せるようにしたい。
- ChatGPTが作るレポートも含めて、**Markdown（優先）で保存 → 自分のWebサイトで閲覧**できる状態を作る。
- 公開範囲は将来的に、一般ユーザ / 認証ユーザ / 管理者ユーザなどで制御できるようにする。

---

## 方針（結論）
- **HTMLスライドは後回し**（XSS対策コストが高い）
- まずは **Markdownレポート保存＆ビューア** を完成させる
  - DBにMarkdownを保存
  - Web側で安全にレンダリングして表示

---

## アーキテクチャ概要
### 保存（DB）
- Supabase（想定）に「Markdown本文＋メタ情報」を保存

### 閲覧（Webサイト）
- Next.js（想定）で
  - 一覧（新しい順 / タグ絞り込み）
  - 詳細（Markdownビューア）
  - 投稿
  - 更新
  - 削除
  - ログイン
- 将来的に検索（全文検索/FTS）も追加可能

---

## 推奨DB設計（最小で強い）
### `reports`（または `entries`）テーブル例
- `id` : uuid
- `slug` : text unique（URL用）
  - 例: `2026-01-23-ai-news`
- `title` : text
- `format` : text（v0は `markdown` 固定でもOK）
- `body_md` : text（Markdown本文）
- `source_urls` : jsonb（参考リンク配列：任意）
- `tags` : jsonb or text[]（または別テーブル運用）
- `visibility` : text
  - 候補: `public` / `auth` / `admin` / `unlisted`
- `owner_user_id` : uuid（作成者）
- `created_at` / `updated_at`
- （任意）`published_at`

> 後で便利：バージョン管理をしたければ `report_versions` を追加

---

## セキュリティ（Markdownでも必須）
「Markdownなら安全」とは限らない（HTML埋め込み等がある）ため、**表示時に必ずサニタイズ**する。

### 推奨（Next.js / React想定）
- `react-markdown` + `remark-gfm`
- **`rehype-sanitize` を必ず使う**
- 可能なら「HTML埋め込みは無効」または「許可タグを最小化」

---

## Web機能
### 画面
- `/reports`：一覧
  - 新しい順
  - タグ絞り込み（任意）
- `/reports/[slug]`：詳細
  - Markdownを安全にレンダリングして表示

※ それ以外は要件定義で実施する。

### 最初の運用
- **投稿画面で登録**（URL + Markdownメモ）から開始

---

## 権限設計（後から拡張しやすい）
- 将来的に `visibility` を使って表示範囲を拡張
  - `public`：誰でも閲覧
  - `auth`：ログインユーザ = 管理者のみ

### Supabase運用（想定）
- RLS（Row Level Security）で `SELECT`/`INSERT`/`UPDATE` を制御
- 管理者判定は最初は **`admins` テーブルに `user_id` 登録** が簡単

---

## 取り込み（保存）方法の整理
### A. 手動クリップ（最初はこれが強い）
- 「いいと思った」→ 管理画面で `title/body_md/source_urls/tags` を保存

### B. 自動生成（将来的）
- LLMでMarkdownレポート生成 → 自作WebAPIへPOST → Supabaseへ保存
- 重複防止のため `idempotency_key`（または `slug` をユニーク）で管理

---

## 次の一手（おすすめ順）
1. Supabaseに `reports` テーブル作成（上の最小カラム）
2. RLS：まずは `admin_only` で閲覧・投稿できるようにする
3. Next.jsで「一覧→詳細」＋Markdownビューア（サニタイズ込み）を作る
4. 管理画面（追加フォーム）を作って運用開始
5. 後で検索・バージョン履歴・公開範囲（public/auth）などを拡張

---

## メモ（なぜHTMLスライドは後回し？）
- HTMLをそのまま表示は自由度が高い反面、**XSS対策コストが高い**
- Markdown中心にしておけば「編集しやすい」「差分が分かる」「表示も安定」
- スライドは後から `format=slide_marp` などで拡張できる

---
