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
| `.claude/rules/` ルールの追加・削除・改名・説明変更・適用範囲（`globs`）変更 | `CLAUDE.md` の Rules テーブル（**全ルールが対象**）／`AGENTS.md`（**エージェント自身の振る舞いを縛るルールのみ**。下記参照） |

該当する変更がない場合はスキップする。

## ファイルを動かしたら、参照している .md を同じ変更セットで直す

影響マップは「**変更種別** → 更新必須ドキュメント」を引くための表であり、「**そのパスを参照している他のドキュメント**」までは辿らない。ファイルの移動・改名・削除は、影響マップに載っていなくても参照側を確実に陳腐化させる。

- **移動・改名・削除をしたら `grep` で参照元を洗い、同じ変更セットで直す**。

  ```bash
  grep -rn --include='*.md' -F 'front/src/old/path.ts' .claude/ docs/ CLAUDE.md AGENTS.md
  ```

- **過去の作業記録（`docs/11-tasks.md` の `[x]` 項目・`docs/lessons-learned.md`）は直さない。** そこに書かれた当時のパスは事実であり、書き換えると履歴が壊れる。直すのは**現在の指示・仕様として読まれる記述**だけ。

## 乖離の棚卸しは機械的に回す

目視のレビューでは、**書いてある内容が正しそうに見えるかどうか**しか判定できない。参照先が実在するかは機械で確かめる（Issue #142）。

```bash
# 1) ドキュメントが参照するファイルパスの実在確認
grep -rhoE '`(front/|docs/|\.claude/|\.github/)[A-Za-z0-9._/-]+`' .claude/rules/*.md docs/*.md CLAUDE.md AGENTS.md \
  | tr -d '`' | sort -u | while read -r p; do [ -e "$p" ] || echo "MISSING: $p"; done

# 2) コードが参照する環境変数と environment.md の一覧の突き合わせ
grep -rhoE 'process\.env\.[A-Z_][A-Z0-9_]*' front/src front/scripts front/tests | sed 's/process\.env\.//' | sort -u
grep -oE '^\| `[A-Z_][A-Z0-9_]*`' .claude/rules/environment.md | tr -d '|` ' | sort -u
```

検出結果は 3 種類に分けて扱う。

| 種類 | 扱い |
|---|---|
| 現在の指示・仕様なのにパスが古い | **直す** |
| 過去の作業記録（`[x]` の完了ログ・教訓） | **直さない**（当時の事実） |
| これから作る想定の前方参照 | **存在しないことを本文で明示する**（読み手が「あるはず」と探さないように） |

## 置き換えた旧方式は「旧案」と見出しで明示する

**古い手順が消されずに残るのは避けられない**（経緯として価値があるため）。危険なのは、それが**現行の手順に見える見出し**で残ることである。

Issue #142 の棚卸しでは、`docs/07-api-specification.md` が同一ファイル内で自己矛盾していた — 上部に「旧案は Testcontainers 方式に置き換えた」と書きながら、下部では旧案を「**API 統合テスト（新規追加 / 正式一覧）**」という見出しで提示し続けていた。しかもその内容は「DB: テスト用 Supabase 実 DB」であり、**`production-data.md` の起点となった事故（テストの接続先が本番を指したまま全削除）へ向かう手順書として読める**状態だった。

- 置き換えた記述を残す場合、**見出しに「旧案」「置き換え済み」を入れる**。本文の但し書きだけに頼らない（見出しから読む人に届かない）。
- **置き換え先の正本がどこかを併記する**。

## 入口ファイルの役割分担（CLAUDE.md / AGENTS.md）

ルールを追加したとき、両方に書くわけではない。**載せる基準が違う**。

| ファイル | 載せるもの | 網羅性 |
|---|---|---|
| `CLAUDE.md` の Rules テーブル | **すべてのルール**（ファイル名・スコープ・1 行説明） | **網羅リスト。過不足があってはならない** |
| `AGENTS.md` の「常に適用するルール」 | **エージェント自身の振る舞いを縛るルール**だけ | **網羅リストではない**（全ルールは `CLAUDE.md` を見る） |

**「エージェント自身の振る舞い」とは、生成するコードの性質ではなく、エージェントが実行・公開する行為そのものを指す。** 見落とすと取り返しがつかないため、`.claude/rules/` を開く前に目に入る場所へ置く。

- 該当する（`AGENTS.md` に載せる）: 本番データへの操作、PR の作成・承認・マージ、教訓の記録、エージェントの運用方法そのもの
- 該当しない（`CLAUDE.md` のみ）: 書くコードの規約（型・命名・レイヤ依存・テスト配置・JSDoc 等）。これらは違反しても CI とレビューで検出できる

**`AGENTS.md` にルール本文を複製しない。** 要点を 1〜2 文で示し、正本は `.claude/rules/` に置く（`codex.md`）。
