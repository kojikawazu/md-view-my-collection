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
