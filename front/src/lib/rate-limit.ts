// 認証系エンドポイントのレートリミット（`.claude/rules/security.md` / `docs/06-security-specification.md`）。
// 保護対象・制限値・手段を選んだ理由は docs/06「レートリミット設計」を正本とする。
//
// Client Component から誤って import されたらビルドを失敗させる。
// このモジュールは Upstash の REST トークンを読むため、クライアントに引き込むと露出する。
import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { RATE_LIMIT_MESSAGE } from '@/constants/auth';

/**
 * 保護対象ごとの制限値。**値の根拠は `docs/06-security-specification.md`「保護対象と脅威」**。
 *
 * カウンタは対象ごとに分ける。`is-allowed`（メール列挙）と `admin`（トークン総当たり）は
 * 脅威が違い、片方の正常利用がもう片方の枠を食う状態にしない。
 */
const LIMITS = {
  /** メールアドレスの列挙を防ぐ。ログイン導線で 1 人が何度も叩く操作ではない */
  'auth-is-allowed': { requests: 10, windowSeconds: 60 },
  /** 管理者判定の総当たりを防ぐ。セッション復帰で複数回叩かれうるため is-allowed より緩い */
  'auth-admin': { requests: 20, windowSeconds: 60 },
  /** 書き込みの濫用。`requireAdmin()` で保護済みのため副次的で、通常操作を妨げない値にする */
  'reports-write': { requests: 30, windowSeconds: 60 },
} as const;

/** レートリミットの適用単位。エンドポイントごとにカウンタを分けるためのキー。 */
export type RateLimitTarget = keyof typeof LIMITS;

/** レートリミットの判定結果。 */
export type RateLimitResult = {
  /** 通してよいなら true。上限超過なら false */
  allowed: boolean;
  /** 再試行までの秒数。`allowed` が true のときは 0。`Retry-After` に載せる */
  retryAfterSeconds: number;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? '';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

/**
 * 環境変数が揃っているときだけ Redis クライアントを作る。
 *
 * 揃っていなければ `null` になり、レートリミットは**無効化して通す**（E2E / CI を壊さないため。
 * `docs/06-security-specification.md`「実装時の制約」）。
 */
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// 対象ごとの Ratelimit インスタンス。モジュールスコープで 1 度だけ生成し、
// リクエストごとに作り直さない（ウォーム起動をまたいで再利用する）。
const limiters: Record<RateLimitTarget, Ratelimit> | null = redis
  ? (Object.fromEntries(
      Object.entries(LIMITS).map(([target, { requests, windowSeconds }]) => [
        target,
        new Ratelimit({
          redis,
          // 固定ウィンドウ境界での瞬間的な倍打ちを避けるためスライディングウィンドウを使う。
          limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
          prefix: `ratelimit:${target}`,
          analytics: false,
        }),
      ]),
    ) as Record<RateLimitTarget, Ratelimit>)
  : null;

// 無効化されていることの警告は 1 度だけ出す。リクエストごとに出すとログが埋まり、
// 逆に「効いていない」という事実が見えなくなる。
let disabledWarningEmitted = false;

/**
 * リクエスト元の識別子を取り出す。
 *
 * Vercel はプラットフォーム側で `x-forwarded-for` を設定するため、クライアントからは詐称できない。
 * 取得できない場合は `unknown` という単一のバケットに寄せる。**フェイルオープン（無制限に通す）に
 * しない**のは、ヘッダーが無い経路が総当たりの抜け道になるのを防ぐため。
 *
 * @param request - 受信リクエスト
 * @returns カウンタのキーに使う識別子
 */
const resolveClientId = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // 複数プロキシを経由すると `client, proxy1, proxy2` と連なる。左端が元のクライアント。
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
};

/**
 * レートリミットを判定する。
 *
 * 環境変数（`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`）が未設定なら
 * **常に通す**（無効化）。Upstash への問い合わせが失敗した場合も通す — レートリミットの
 * 障害でログイン自体を止める方が損害が大きいため、可用性を優先する。
 *
 * @param target - 適用する制限の種類
 * @param request - 受信リクエスト（送信元 IP の解決に使う）
 * @returns 通過可否と再試行までの秒数
 */
export const checkRateLimit = async (
  target: RateLimitTarget,
  request: Request,
): Promise<RateLimitResult> => {
  if (!limiters) {
    if (!disabledWarningEmitted) {
      disabledWarningEmitted = true;
      console.warn(
        '[rate-limit] disabled: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN が未設定',
      );
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  try {
    const { success, reset } = await limiters[target].limit(resolveClientId(request));
    if (success) return { allowed: true, retryAfterSeconds: 0 };
    // `reset` はウィンドウが空くエポックミリ秒。切り上げて最低 1 秒を保証する。
    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { allowed: false, retryAfterSeconds };
  } catch (error) {
    console.error('[rate-limit] check failed', error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
};

/**
 * 上限超過時に返すレスポンスを組み立てる。
 *
 * 本文は統一エラーレスポンス `{ error: string }` に揃える（`.claude/rules/error-handling.md`）。
 *
 * @param result - `checkRateLimit` の結果（`retryAfterSeconds` を `Retry-After` に載せる）
 * @returns 429 のレスポンス
 */
export const rateLimitResponse = (result: RateLimitResult): NextResponse =>
  NextResponse.json(
    { error: RATE_LIMIT_MESSAGE },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } },
  );
