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

## アサーションの並べ方（前提確認で本命を隠さない）

**「テストが赤くなった」ことは「意図した観点を検証できた」ことを意味しない。** Vitest も Playwright も最初の `expect` 失敗でその test の実行を打ち切るため、**前提確認が先に落ちると、本来の検証対象は一度も評価されない**。テストは存在するのに安心感だけを生む状態になる（Issue #187 / `docs/lessons-learned.md`）。

次の 3 条件がそろうと顕在化する。

1. 1 つの test に「前提確認」と「本来の検証対象」が同居している
2. 前提確認が先頭にある
3. 前提が壊れる変更と、検証対象が壊れる変更が**同じ原因で同時に起きうる**

**セキュリティ・認可の観点（サニタイズ・401/403・マスキング・過剰公開）で最も危険**になる。壊れても画面は正常に見えるため、テスト以外に検知手段が無い。

### 対処（順序を入れ替えても直らない）

先頭のアサーションが後続を隠す構造そのものが原因なので、**並べ替えでは隠す側が入れ替わるだけ**。次のどちらかを採る。

| 手段 | 既定にするレベル | 使いどころ |
|---|---|---|
| **test を分割する** | **UT / IT** | 独立した観点が同居している場合。1 テストが軽いので分割コストが低い（例: `requireAdmin` の 401 と 403 は別 `it` にする） |
| **前提確認を `expect.soft()` にする** | **E2E** | 前提確認を消すと偽の緑になる場合。`toHaveCount(0)` 系は画面が描画されていなくても通るため前提確認が要る。soft は失敗を記録したうえで後続を必ず評価する |

- `expect.soft()` は Vitest・Playwright の双方にある。**失敗しても最後まで走り、最終的には赤になる**（見逃しにはならない）。
- **soft にしてよいのは前提確認だけ。検証対象そのものを soft にしない。**
- 分割したら**テスト名も観点ごとに書き直す**。`異常: 未認証 401 / 非管理者 403` のように名前が 2 観点を指しているものは、分割対象の目印になる。

### ミューテーションテスト（手動・セキュリティ観点に限定）

自動化ツール（Stryker 等）は導入しない（実行コストが観点に見合わない）。**セキュリティ・認可のテストを追加・変更したときだけ**、手動で次を確認する。

1. 実装側に意図的な変異を与える（サニタイズを外す / `requireAdmin` を素通しにする 等）
2. 対象のテストが**赤くなること**を確認する
3. **どのアサーションで落ちたか**を確認する。前提確認で落ちているなら、そのテストは本来の観点を検証できていない
4. 変異を戻す

**3 が本体**である。「落ちたから OK」で止めない。

## テスト用 DB の接続先（破壊防止）

**テストが本番 DB を指し得ない構造にする。** 姉妹プロジェクトで、テストの接続先が本番 Supabase を指したまま seed の `deleteMany()` が走り、本番データが全削除される事故が起きている（Issue #168 / `production-data.md`）。

- **接続先の決定に `DATABASE_URL` を参照しない。** この変数は本番を指す（`front/.env.local`）。`@prisma/client` の import 時点で `.env` が `process.env` に読み込まれるため、テストコードから見えてしまう。
- **上書きはテスト専用の環境変数（`TEST_DATABASE_URL`）のみで行う。**
- **`環境変数 ?? ローカル既定` 形式のフォールバックを書かない。** 「未設定なら安全側」に見えて、実際は「**値が入っていれば危険側**」に倒れる。これが事故の直接原因。
- **ホスト allowlist（`localhost` / `127.0.0.1` / `::1`）で検証し、破壊的操作の前に throw する。** seed / migrate / `TRUNCATE` / `deleteMany()` を実行してからの検知では遅い。
- **接続先の解決は 1 モジュールに集約し、IT・E2E・seed 系スクリプトが必ずそこを通るようにする。** 解決ロジックが散ると、ガードを通らない経路が後から増える。
- **失敗メッセージに接続先ホストと復旧手順**（テスト DB の起動方法）を含める。原因が分からないと、回避策として接続先を書き換えられてしまう。
- **ガード自体に UT を書く。** 特に「`DATABASE_URL` に本番 URL が入っていてもガードが汚染されない」ことは、事故の直接原因に対応する回帰テストとして必須。

**実装は `front/tests/support/db-target.ts`**（Issue #176）。接続先を必要とするテスト・スクリプトは、新規・既存を問わず必ずこのモジュールを経由する。

| 関数 | 用途 |
|---|---|
| `resolveTestDatabaseUrl(containerUrl?)` | 接続先を解決する。`TEST_DATABASE_URL` → 引数の順に採用し、必ず検証を通す |
| `assertLocalDatabaseTarget(url, source)` | 既にある URL を検証する。破壊的操作の前に呼ぶ |
| `hasTestDatabaseUrlOverride()` | 上書きの有無。コンテナ起動が必要かの判断に使う |

許可ホストの定義は `front/scripts/db-host-allowlist.ts` にあり、**Prisma CLI のガード（`scripts/prisma-guard.ts` / `production-data.md`）と共有している**。ここを緩めると両方の防御が同時に緩む。

> **例外**: `front/prisma.config.ts` は `DATABASE_URL`（本番）を意図的に使う。`prisma db pull` が DB 側で管理されているスキーマを取り込むための正当な経路であり、テスト用の接続先解決には一切関与しない。破壊的サブコマンドの禁止は `production-data.md` を参照。

## ディレクトリ配置

- ユニットテスト: `front/src/<module>/__tests__/` に配置する
- 統合テスト: `front/tests/integration/` に配置する
- E2Eテスト: `front/tests/e2e/` に配置する
- テスト補助モジュール（接続先ガード等）: `front/tests/support/` に置き、その UT は `front/tests/support/__tests__/` に配置する
  - **`src/` に置かない**。本番バンドルに混ざるうえ、`dead-code.md` の「未使用 export」として扱われてしまうため
  - この UT は `pnpm test`（`vitest.config.ts`）で実行される。`tests/e2e` / `tests/integration` のみ別ランナーに分かれる

## 実行コマンド（`front/` ディレクトリで実行）

```bash
pnpm test             # ユニットテスト実行
pnpm test:watch       # ユニットテスト（watchモード）
pnpm test:integration # 統合テスト実行（Docker 必須）
pnpm test:e2e         # E2Eテスト実行
pnpm test:e2e:ui      # UIモード
pnpm test:e2e:report  # レポート表示
```
