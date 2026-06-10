# Docs Index

要件・仕様・設計・タスクを番号付きの仕様書として `docs/` 直下に集約する（フラット構成）。

| # | ファイル | 内容 |
|---|---|---|
| 01 | `01-business-requirements.md` | 要求仕様書 — 背景・目的・方針・将来構想（読み取り専用・履歴） |
| 02 | `02-requirements-specification.md` | 要件仕様書 — 機能要件一覧・受け入れ条件・権限・コーディング規約 |
| 03 | `03-functional-specification.md` | 機能仕様書 — 画面構成・UIレイアウト・ルーティング・外部URL機能仕様 |
| 04 | `04-non-functional-specification.md` | 非機能仕様書 — デプロイ・CI/CD・ログ・運用 |
| 05 | `05-data-specification.md` | データ仕様書 — データモデル・スキーマ・RLS・バリデーション |
| 06 | `06-security-specification.md` | セキュリティ仕様書 — 認証・認可・XSS対策・シークレット管理 |
| 07 | `07-api-specification.md` | API 仕様書 — Route Handlers 設計・エンドポイント・外部URL API |
| 08 | `08-test-specification.md` | テスト仕様書 — E2Eテスト仕様 + ユニット/E2E強化のテスト設計 |
| 09 | `09-architecture-specification.md` | アーキテクチャ仕様書 — アトミックデザイン・コンポーネント設計・技術スタック |
| 10 | `10-miscellaneous-specification.md` | その他仕様書 — Markdown ライブラリ調査・データ品質チェックレポート |
| 11 | `11-tasks.md` | タスク — 開発タスク・進捗管理 |

## 目次

- [読む順序（オンボーディング）](#読む順序オンボーディング)
- [運用](#運用)

## 読む順序（オンボーディング）

初めてこのプロジェクトに触れる場合は、以下の順で読むと全体像→詳細の流れで把握できます。

1. ルート `README.md`（概要・機能・セットアップ）
2. `01-business-requirements.md`（なぜ作るか・背景）※要件定義前の生メモ
3. `02-requirements-specification.md`（何を作るか・機能要件）
4. `03-functional-specification.md`（画面・UI・画面遷移）
5. `09-architecture-specification.md`（全体構成・コンポーネント設計）
6. `05-data-specification.md` → `07-api-specification.md`（データ→API）
7. `06-security-specification.md` / `04-non-functional-specification.md`（横断的関心事）
8. `08-test-specification.md`（テスト） / `11-tasks.md`（進捗）

`10-miscellaneous-specification.md` は参照資料（ライブラリ調査・データ品質履歴）で、必要時に参照すれば十分です。

## 運用

- 作業開始前に `11-tasks.md` で現状を確認し、完了後に更新する。
- コード変更に伴うドキュメント更新ルールは `.claude/rules/documentation.md`（影響マップ）を参照。
