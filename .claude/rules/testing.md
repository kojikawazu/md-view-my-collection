---
description: テスト方針・配置規約・カバレッジ基準
globs: 
---

# テスト方針

- テストは**正常/準正常/異常**をすべて必須とする。
- ユニットテストとE2Eテストの両方でカバーする。
- E2Eは `NEXT_PUBLIC_AUTH_MODE=local` / `NEXT_PUBLIC_DATA_MODE=local` で動作させる。

## テストツール

| テスト種別 | ツール |
|-----------|--------|
| ユニットテスト | Vitest + @testing-library/react |
| E2E テスト | Playwright |

## ディレクトリ配置

- ユニットテスト: `front/src/<module>/__tests__/` に配置する
- E2Eテスト: `front/tests/e2e/` に配置する

## 実行コマンド（`front/` ディレクトリで実行）

```bash
pnpm test            # ユニットテスト実行
pnpm test:watch      # ユニットテスト（watchモード）
pnpm test:e2e        # E2Eテスト実行
pnpm test:e2e:ui     # UIモード
pnpm test:e2e:report # レポート表示
```
