---
description: ドキュメント更新・設計書管理ルール（影響マップ + opt-out の完了条件）
globs: 
---

# ドキュメント

コード変更がドキュメント（CLAUDE.md / docs/）と乖離しないことを構造的に担保する。

## 完了条件（opt-out）

変更は、下記「影響マップ」の対応ドキュメントを**同一 PR 内で更新する**ことを完了条件とする。

- 更新不要と判断した場合は、**PR 説明にその理由を明記する**（省略＝未対応とみなす）。
- この乖離チェックは `/self-review` と `/pr-create` の確認対象に含まれる。

## 影響マップ（変更種別 → 更新必須ドキュメント）

「どのドキュメントだっけ？」を考えさせないための逆引き表。

| 変更種別 | 更新必須ドキュメント |
|---|---|
| タスクの着手・完了・追加 | `docs/11-tasks.md` |
| 要件・前提条件の変更 | `docs/01-business-requirements.md`（要求・履歴）／`docs/02-requirements-specification.md`（要件） |
| UI レイアウト・画面構成・機能仕様の変更 | `docs/03-functional-specification.md` |
| 非機能（デプロイ・CI/CD・ログ）の変更 | `docs/04-non-functional-specification.md` |
| データモデル・スキーマ・RLS の変更 | `docs/05-data-specification.md`、`.claude/rules/database.md` |
| セキュリティ（認証・認可・XSS）の変更 | `docs/06-security-specification.md`、`.claude/rules/security.md` |
| API ルート（Route Handlers）の追加・変更 | `docs/07-api-specification.md`、`.claude/rules/api.md` |
| E2E / ユニットテストケースの追加・変更 | `docs/08-test-specification.md` |
| コンポーネント設計（アトミックデザイン）・技術スタックの変更 | `docs/09-architecture-specification.md`、`CLAUDE.md` |
| 外部 URL 仕様の変更 | `docs/03-functional-specification.md`（機能）／`docs/05-data-specification.md`（データ）／`docs/07-api-specification.md`（API）／`docs/09-architecture-specification.md`（コンポーネント） |
| Markdown ライブラリ・データ品質などの参照資料 | `docs/10-miscellaneous-specification.md` |
| `.claude/rules/` ルールの追加・削除・改名・説明変更・適用範囲（`globs`）変更 | `CLAUDE.md` の Rules テーブル、`AGENTS.md`（glob を持たない常時適用ルールは「常に適用するルール」へ） |

該当する変更がない場合はスキップする。
