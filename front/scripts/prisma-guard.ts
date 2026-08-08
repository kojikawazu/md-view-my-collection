/**
 * Prisma CLI の破壊的サブコマンドが本番 DB に届くのを防ぐガード。
 *
 * `prisma.config.ts` は `.env.local` を読み込むため、そこで解決される `DATABASE_URL` は
 * **本番 Supabase を指す**（本プロジェクトに開発用 Supabase 環境は無い）。`prisma.config.ts`
 * は Prisma CLI の全サブコマンドで読み込まれるため、ガードが無いと `prisma db push` や
 * `prisma migrate reset` がそのまま本番に届く（Issue #178 / `.claude/rules/production-data.md`）。
 *
 * **判定軸はコマンド名ではなく接続先。** 禁止したいのは「本番を壊すこと」であって
 * 「コマンドそのもの」ではない。コマンド名だけで拒否すると、将来ローカル DB や開発用環境を
 * 用意したときに正当な操作まで塞がれ、その手間が「ガードを常に外しておく」動機になる。
 */
import { extractDatabaseHost, isAllowedDbHost, ALLOWED_DB_HOSTS } from './db-host-allowlist';

/**
 * 接続先がローカルでなければ実行を許さないサブコマンド。
 *
 * Prisma CLI の第 1・第 2 位置引数を空白で連結した形で列挙する。
 * `studio` を含めるのは、GUI から本番データを編集できてしまうため
 * （`production-data.md`「既定は read-only」）。
 */
const DESTRUCTIVE_COMMANDS = [
  'db push',
  'db execute',
  'db seed',
  'migrate reset',
  'migrate dev',
  'migrate deploy',
  'studio',
] as const;

/**
 * `process.argv` から Prisma のサブコマンドを取り出す。
 *
 * 最初のフラグ（`-` 始まり）以降は読まない。フラグの値が位置引数と区別できないため、
 * サブコマンド名として意味を持つ先頭 2 語だけを見る。
 *
 * @param argv - `process.argv` 相当の配列（先頭 2 要素は node 実行系として読み飛ばす）
 * @returns 空白区切りのサブコマンド。特定できない場合は空文字
 */
export function extractPrismaSubcommand(argv: readonly string[]): string {
  const positionals: string[] = [];

  for (const token of argv.slice(2)) {
    if (token.startsWith('-')) break;
    positionals.push(token);
    if (positionals.length === 2) break;
  }

  return positionals.join(' ');
}

/**
 * そのサブコマンドが、本番接続先に対して実行されてはならないものか。
 *
 * **未知のサブコマンドは破壊的として扱わない。** 過剰に塞ぐとガード自体を無効化されやすく、
 * それは本ガードが防ごうとしている状態そのものだから。既知の危険操作を確実に止めることに
 * 絞り、網羅性はルール（`production-data.md`）側で担保する。
 *
 * @param subcommand - {@link extractPrismaSubcommand} が返した文字列
 * @returns 破壊的サブコマンドなら `true`
 */
export function isDestructivePrismaCommand(subcommand: string): boolean {
  return DESTRUCTIVE_COMMANDS.some(
    (destructive) => subcommand === destructive || subcommand.startsWith(`${destructive} `),
  );
}

/**
 * 破壊的サブコマンド × 非ローカル接続先の組み合わせを拒否する。
 *
 * 破壊的でなければ接続先を問わず通す（`db pull` / `generate` / `migrate diff` などの
 * 正当な本番参照を塞がないため）。
 *
 * @param argv - `process.argv` 相当の配列
 * @param databaseUrl - 解決された接続先 URL。未解決なら `undefined`
 * @throws {Error} 破壊的サブコマンドが、許可リスト外のホスト（または解釈不能な URL）に向いている場合
 */
export function assertPrismaCommandAllowed(
  argv: readonly string[],
  databaseUrl: string | undefined,
): void {
  const subcommand = extractPrismaSubcommand(argv);

  if (!isDestructivePrismaCommand(subcommand)) return;

  // 接続先が未設定なら Prisma 側が解決に失敗する。ここで独自に落とす必要はない。
  if (!databaseUrl) return;

  const hostname = extractDatabaseHost(databaseUrl);

  if (hostname !== null && isAllowedDbHost(hostname)) return;

  throw new Error(
    `[prisma-guard] \`prisma ${subcommand}\` は本番 DB を破壊し得るため中断しました。\n` +
      `  接続先ホスト: ${hostname ?? '(URL として解釈できません)'}\n` +
      `  許可されるのは ${ALLOWED_DB_HOSTS.join(' / ')} のみです。\n` +
      `  本プロジェクトに開発用 Supabase 環境は無く、DATABASE_URL は本番を指します。\n` +
      `  スキーマ変更は DB 側の別プロジェクトで管理します（.claude/rules/database.md）。\n` +
      `  例外的に本番へ変更を加える必要がある場合は .claude/rules/production-data.md の例外手順に従ってください。`,
  );
}
