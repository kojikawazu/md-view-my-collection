# md-view-my-collection

Markdownレポートの保存・閲覧UIの要求整理とレイアウト設計を管理するリポジトリです。

## 構成
- `docs/` 要件定義・UI仕様・E2E仕様
- `base/` 最新レイアウトの参照実装（読み取り専用）
- `front/` 開発用コピー（Git管理外）

## ドキュメント
- `docs/01.pre-requirements.md` 初期要求整理（読み取り専用）
- `docs/02.ui-layout.md` 最新UIレイアウト要求
- `docs/03.requirements.md` 要件定義（機能/非機能/規約）
- `docs/04.e2e-cases.md` E2Eテスト仕様（厳密版）
- `docs/TASKS.md` タスク一覧

## 開発メモ
- `base/` は変更しないこと。
- 開発は `front/` に `base/` を1回コピーして実施（`front/` は `.gitignore` 管理）。
