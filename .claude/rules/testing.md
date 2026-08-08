---
description: テスト方針・配置規約・カバレッジ基準
globs: 
---

# テスト方針

- テストは**正常/準正常/異常**をすべて必須とする。
- ユニットテスト（UT）・統合テスト（IT）・E2E テストの 3 レベルでカバーする。
- E2Eは `NEXT_PUBLIC_AUTH_MODE=local` / `NEXT_PUBLIC_DATA_MODE=local` で動作させる。

## テストツール

| テスト種別 | ツール |
|-----------|--------|
| ユニットテスト | Vitest + @testing-library/react |
| 統合テスト（IT） | Vitest + Testcontainers（Postgres）。**Docker 必須** |
| E2E テスト | Playwright |

- IT は **API ルート × 実 DB** を対象とし、モックしない。詳細な方針（`globalSetup` で 1 度だけコンテナ起動、テスト間 `TRUNCATE`、RLS はスコープ外）は `docs/08-test-specification.md` を参照する。
- IT が使うスキーマ DDL は `pnpm gen:test-schema` で生成する（`database.md` の test-only 例外）。

## テスト用 DB の接続先（破壊防止）

**テストが本番 DB を指し得ない構造にする。** 姉妹プロジェクトで、テストの接続先が本番 Supabase を指したまま seed の `deleteMany()` が走り、本番データが全削除される事故が起きている（Issue #168 / `production-data.md`）。

- **接続先の決定に `DATABASE_URL` を参照しない。** この変数は本番を指す（`front/.env.local`）。`@prisma/client` の import 時点で `.env` が `process.env` に読み込まれるため、テストコードから見えてしまう。
- **上書きはテスト専用の環境変数（`TEST_DATABASE_URL`）のみで行う。**
- **`環境変数 ?? ローカル既定` 形式のフォールバックを書かない。** 「未設定なら安全側」に見えて、実際は「**値が入っていれば危険側**」に倒れる。これが事故の直接原因。
- **ホスト allowlist（`localhost` / `127.0.0.1` / `::1`）で検証し、破壊的操作の前に throw する。** seed / migrate / `TRUNCATE` / `deleteMany()` を実行してからの検知では遅い。
- **接続先の解決は 1 モジュールに集約し、IT・E2E・seed 系スクリプトが必ずそこを通るようにする。** 解決ロジックが散ると、ガードを通らない経路が後から増える。
- **失敗メッセージに接続先ホストと復旧手順**（テスト DB の起動方法）を含める。原因が分からないと、回避策として接続先を書き換えられてしまう。
- **ガード自体に UT を書く。** 特に「`DATABASE_URL` に本番 URL が入っていてもガードが汚染されない」ことは、事故の直接原因に対応する回帰テストとして必須。

> **実装状況**: ガードは未導入（Issue #176 で対応）。現行の IT は `tests/integration/global-setup.ts` が Testcontainers の URI で `DATABASE_URL` を常に上書きするため結果的に安全だが、**接続先が非ローカルだったときに失敗する仕組みは無い**。本節はルールが先行しており、新規のテスト・スクリプトは移行を待たず本節に従うこと。

## ディレクトリ配置

- ユニットテスト: `front/src/<module>/__tests__/` に配置する
- 統合テスト: `front/tests/integration/` に配置する
- E2Eテスト: `front/tests/e2e/` に配置する

## 実行コマンド（`front/` ディレクトリで実行）

```bash
pnpm test             # ユニットテスト実行
pnpm test:watch       # ユニットテスト（watchモード）
pnpm test:integration # 統合テスト実行（Docker 必須）
pnpm test:e2e         # E2Eテスト実行
pnpm test:e2e:ui      # UIモード
pnpm test:e2e:report  # レポート表示
```
