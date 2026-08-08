/**
 * テスト用 DB の接続先を解決・検証する唯一の窓口。
 *
 * IT・E2E・seed 系スクリプトは必ずこのモジュールを経由して接続先を得る。解決ロジックが
 * 散ると、ガードを通らない経路が後から増えるため（`.claude/rules/testing.md`）。
 *
 * **`DATABASE_URL` は決して参照しない。** この変数は本番 Supabase を指し（`front/.env.local`）、
 * `@prisma/client` の import 時点で `.env` が `process.env` へ読み込まれるためテストコードからも
 * 見えてしまう。姉妹プロジェクトでは `process.env.DATABASE_URL ?? ローカル既定` というフォール
 * バックが本番データ全削除を引き起こした（Issue #168 / `.claude/rules/production-data.md`）。
 * 「未設定なら安全側」に見えて、実際は「値が入っていれば危険側」に倒れる。
 */

import {
  ALLOWED_DB_HOSTS,
  extractDatabaseHost,
  isAllowedDbHost,
} from '../../scripts/db-host-allowlist';

/** テスト DB を起動する手順。ガード失敗時のメッセージに載せ、回避策として接続先を書き換えられるのを防ぐ。 */
const RECOVERY_HINT =
  'テスト DB は `pnpm test:integration` が Testcontainers で起動します（Docker が必要）。' +
  '自前のローカル Postgres を使う場合のみ TEST_DATABASE_URL に localhost の接続先を設定してください。';

/**
 * 接続先の解決元。どこから来た値かをエラーメッセージに含めるために使う。
 */
type TargetSource =
  /** テスト専用の環境変数による明示的な上書き */
  | 'TEST_DATABASE_URL'
  /** globalSetup が起動した Testcontainers のコンテナ */
  | 'testcontainers';

/**
 * 接続先がローカルの使い捨て DB を指していることを検証する。破壊的操作の**前**に呼ぶ。
 *
 * seed / migrate / `TRUNCATE` / `deleteMany()` を実行してからの検知では手遅れになるため、
 * スキーマ適用や接続の前段でこの関数を通す。
 *
 * @param url - 検証する DB 接続 URL
 * @param source - この URL の出どころ。エラーメッセージに含める
 * @returns 検証を通過した `url` をそのまま返す（代入式にそのまま書けるようにするため）
 * @throws {Error} URL として解釈できない場合、またはホストが許可リストに無い場合
 */
export function assertLocalDatabaseTarget(url: string, source: TargetSource): string {
  const hostname = extractDatabaseHost(url);

  if (hostname === null) {
    throw new Error(
      `テスト DB の接続先が URL として解釈できません（出どころ: ${source}）。${RECOVERY_HINT}`,
    );
  }

  if (!isAllowedDbHost(hostname)) {
    throw new Error(
      `テスト DB の接続先がローカルではありません: host=${hostname}（出どころ: ${source}）。` +
        `許可されるのは ${ALLOWED_DB_HOSTS.join(' / ')} のみです。` +
        `本番 DB を破壊しないため中断しました。${RECOVERY_HINT}`,
    );
  }

  return url;
}

/**
 * テスト用 DB の接続先を解決する。
 *
 * 優先順位は `TEST_DATABASE_URL` → 引数の `containerUrl`。**`DATABASE_URL` は参照しない**。
 * どちらの経路でも {@link assertLocalDatabaseTarget} を通すため、本番を指した接続先が
 * 返ることはない。
 *
 * @param containerUrl - Testcontainers が払い出した接続 URI。環境変数による上書きが無い場合に使う
 * @returns 検証済みの接続 URL
 * @throws {Error} 接続先を 1 つも特定できない場合、または特定した接続先がローカルでない場合
 */
export function resolveTestDatabaseUrl(containerUrl?: string): string {
  const override = process.env.TEST_DATABASE_URL?.trim();

  if (override) {
    return assertLocalDatabaseTarget(override, 'TEST_DATABASE_URL');
  }

  if (containerUrl) {
    return assertLocalDatabaseTarget(containerUrl, 'testcontainers');
  }

  throw new Error(`テスト DB の接続先を特定できません。${RECOVERY_HINT}`);
}

/**
 * 環境変数による接続先の上書きが指定されているか。
 *
 * globalSetup が「コンテナを起動する必要があるか」を判断するために使う。値の検証は行わない
 * （検証は {@link resolveTestDatabaseUrl} の責務）。
 *
 * @returns `TEST_DATABASE_URL` に空でない値が設定されていれば `true`
 */
export function hasTestDatabaseUrlOverride(): boolean {
  return Boolean(process.env.TEST_DATABASE_URL?.trim());
}
