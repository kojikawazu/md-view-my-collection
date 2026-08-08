---
description: Git ワークフロー（ブランチ運用・コミットメッセージ・マージ条件。PR 本文は pr-description.md）
globs: 
---

# Git ワークフロー（コミット・ブランチ・PR）

## ブランチ運用

- 開発は必ずブランチを切って作業する。`main` への直接コミットは禁止。
- ブランチ名は作業内容を表すケバブケース（例: `feat/report-filter`, `fix/auth-redirect`, `chore/update-deps`）。
- Vercel は `main` ブランチのみ本番デプロイ（プレビュー無し）。

## コミットメッセージ

- 短い命令形（英語）で書く。
  - Good: `Add report filter state`
  - Good: `Fix admin email check`
  - Bad: `修正しました` / `update`
- 1コミット1論点。無関係な変更を混ぜない。

## Pull Request

- **PR 本文（初回コメント）に何を書くかは `pr-description.md` を正本とする**（変更種別ごとの必須セクション）。本ファイルには重複して書かない。
- **スクリーンショット**: UI 変更時は必須（before/after があると良い）。差分から読み取れないため、本文の必須セクションとは別に添付する。
- マージ前に CI（ビルド・テスト・lint）がグリーンであること。
