---
description: Git ワークフロー（ブランチ運用・コミットメッセージ・PR 規約）
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

- PR には以下を必ず含める:
  - **概要**: 何を・なぜ変更したか
  - **テストメモ**: 実行したテスト・確認手順
  - **スクリーンショット**: UI 変更時は必須（before/after があると良い）
- マージ前に CI（ビルド・テスト・lint）がグリーンであること。
