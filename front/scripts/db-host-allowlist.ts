/**
 * 「DB 接続先がローカルか」を判定する共有ロジック。
 *
 * テスト経路（`tests/support/db-target.ts`）と Prisma CLI 経路（`scripts/prisma-guard.ts`）の
 * 双方が本番 DB への破壊的操作を防ぐために使う。**同じ知識を 2 箇所に持たない**
 * （`.claude/rules/duplication.md`）— 許可ホストが片方だけ緩められると、そこが穴になる。
 *
 * 通信を持たない純粋関数のみを置く。
 */

/**
 * 破壊的操作を許可する DB ホスト。
 *
 * ローカルの使い捨て DB のみを想定する。Testcontainers はホストの 127.0.0.1 にポートを
 * 公開するため、この 3 つで足りる。**リモートホストを足さない** — 追加した時点で、本番を
 * 含むホストへ到達し得る状態に戻る。開発用 DB を用意した場合のみ、その追加を
 * レビュー付きの変更として行う。
 */
export const ALLOWED_DB_HOSTS = ['localhost', '127.0.0.1', '::1'] as const;

/**
 * DB 接続 URL からホスト名を取り出す。IPv6 リテラルの角括弧は除去する。
 *
 * @param url - 対象の接続 URL
 * @returns ホスト名。URL として解釈できない場合は `null`
 */
export function extractDatabaseHost(url: string): string | null {
  try {
    // `new URL('postgresql://u:p@[::1]:5432/db').hostname` は '[::1]' を返すため角括弧を剥がす。
    return new URL(url).hostname.replace(/^\[|\]$/g, '');
  } catch {
    return null;
  }
}

/**
 * ホスト名が許可リストに含まれるか。
 *
 * @param hostname - 判定するホスト名
 * @returns 許可リストに含まれていれば `true`
 */
export function isAllowedDbHost(hostname: string): boolean {
  // `includes` は引数を ALLOWED_DB_HOSTS のリテラル union に狭めるためキャストが要る。
  // `some` + `===` なら string のまま比較でき、アサーションを持ち込まずに済む。
  return ALLOWED_DB_HOSTS.some((allowed) => allowed === hostname);
}
