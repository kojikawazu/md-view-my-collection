# ドキュメント索引

md-view-my-collection の仕様・設計ドキュメント一覧。プロジェクト概要はリポジトリ直下の [../README.md](../README.md) を参照。

ドキュメントは `docs/` 直下の標準仕様書（`01`〜`11`）に集約している。

- 標準仕様書（`01`〜`11`）: 仕様の正準。番号順に読むと全体像を把握しやすい。
- 補足ルール: 実装/運用ルールは [../.claude/rules/](../.claude/rules/) を参照。

## 読み進め順（おすすめ）

`01 要求 → 02 要件 → 03 機能 → 05 データ → 06 セキュリティ → 07 API → 08 テスト → 09 アーキテクチャ`。
`04`・`10`・`11` は必要に応じて随時参照する。

## 標準仕様書

| # | ドキュメント | 概要 |
|---|---|---|
| 01 | [要求仕様書](01-business-requirements.md) | 背景・目的・方針・将来構想（読み取り専用・履歴） |
| 02 | [要件仕様書](02-requirements-specification.md) | 機能要件一覧・受け入れ条件・権限・コーディング規約 |
| 03 | [機能仕様書](03-functional-specification.md) | 画面構成・UIレイアウト・ルーティング・外部URL機能仕様 |
| 04 | [非機能仕様書](04-non-functional-specification.md) | デプロイ・CI/CD・ログ・運用 |
| 05 | [データ仕様書](05-data-specification.md) | データモデル・スキーマ・RLS・バリデーション |
| 06 | [セキュリティ仕様書](06-security-specification.md) | 認証・認可・XSS対策・シークレット管理 |
| 07 | [API 仕様書](07-api-specification.md) | Route Handlers 設計・エンドポイント・外部URL API |
| 08 | [テスト仕様書](08-test-specification.md) | E2E仕様 + ユニット/E2E強化のテスト設計 |
| 09 | [アーキテクチャ仕様書](09-architecture-specification.md) | アトミックデザイン・コンポーネント設計・技術スタック |
| 10 | [その他仕様書](10-miscellaneous-specification.md) | Markdown ライブラリ調査・データ品質チェックレポート |
| 11 | [タスク](11-tasks.md) | 開発タスク・進捗管理 |

## 運用

- 作業開始前に [11-tasks.md](11-tasks.md) を確認し、完了後に更新する。
- コード変更に伴うドキュメント更新ルールは [../.claude/rules/documentation.md](../.claude/rules/documentation.md)（影響マップ）を参照。

## 関連

- 開発ルール: [../CLAUDE.md](../CLAUDE.md) と [../.claude/rules/](../.claude/rules/)
