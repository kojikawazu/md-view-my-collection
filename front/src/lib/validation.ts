import type { ExternalUrlInput } from '@/types';
import {
  LIMITS,
  normalizeTags,
  reportCreateSchema,
  reportPatchSchema,
} from '@/lib/schemas/report';

/**
 * ランタイム検証アダプタ。
 *
 * 契約の正準は `lib/schemas/report.ts`（zod）。このモジュールはそれを包み、
 * 既存の `{ data, errors }`（フィールド名 → 日本語メッセージ）形式を維持する。
 * これにより Route Handler とフロントのエラー契約を変更せずに済む。
 */

/** フィールド名 → 日本語エラーメッセージ。エラーの無いフィールドはキーごと省略する。 */
export type ValidationErrors = {
  title?: string;
  content?: string;
  category?: string;
  author?: string;
  tags?: string;
  summary?: string;
};

/** 検証モード切替。`partial: true` で部分更新（PATCH）スキーマを使う。 */
type ValidateOptions = {
  partial?: boolean;
};

type NormalizedReport = {
  title?: string;
  content?: string;
  category?: string;
  author?: string;
  tags?: string[];
  summary?: string | null;
  publishDate?: Date | null;
};

export { normalizeTags };

// validateReportInput は本文フィールドのみを扱う（externalUrls は別関数で検証）。
const createReportSchema = reportCreateSchema.omit({ externalUrls: true });
const patchReportSchema = reportPatchSchema.omit({ externalUrls: true });

/**
 * zod の issues を、先勝ちでフィールド名 → メッセージの平坦な形へ変換する。
 *
 * @param issues - zod のバリデーション issue 配列（`path` の先頭要素をフィールド名に使う）
 * @returns フィールド名をキー、最初のエラーメッセージを値に持つオブジェクト
 */
const toFieldErrors = (issues: { path: PropertyKey[]; message: string }[]): ValidationErrors => {
  const errors: ValidationErrors = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key !== 'string') continue;
    if (!(key in errors)) {
      (errors as Record<string, string>)[key] = issue.message;
    }
  }
  return errors;
};

/**
 * レポート本文フィールド（title/content/category/author/tags/summary/publishDate）を検証・正規化する。
 *
 * `externalUrls` はここでは扱わず `validateExternalUrls` が担当する。
 * 成功時は正規化済みの `data` と空の `errors`、失敗時は空の `data` と `errors`（先勝ち）を返す。
 *
 * @param input 検証対象の生入力（unknown。zod 側で寛容に正規化する）
 * @param options `partial: true` で部分更新スキーマを使う（未指定フィールドを許容）
 * @returns 正規化済みデータとフィールド別エラーの組
 */
export const validateReportInput = (
  input: unknown,
  options: ValidateOptions = {},
): { data: NormalizedReport; errors: ValidationErrors } => {
  const schema = options.partial ? patchReportSchema : createReportSchema;
  const result = schema.safeParse(input);

  if (!result.success) {
    return { data: {}, errors: toFieldErrors(result.error.issues) };
  }

  // 値が undefined のキーは落とす（部分更新で「未指定」を保持するため）。
  const data: NormalizedReport = {};
  for (const [key, value] of Object.entries(result.data)) {
    if (value !== undefined) {
      (data as Record<string, unknown>)[key] = value;
    }
  }
  return { data, errors: {} };
};

const URL_PATTERN = /^https?:\/\//;

/**
 * 外部URL配列を検証・正規化する。
 *
 * URL は必須かつ `http(s)://` 始まり、label は任意で最大長チェック。
 * エラーキーは `externalUrls.{index}.url` / `externalUrls.{index}.label` の形で、
 * フロントが該当行にエラーを紐付けられるようにする。未指定（undefined/null）は空データとして許容する。
 *
 * @param urls 検証対象（配列でなければ全体エラーを返す）
 * @returns トリム済みの `data` とインデックス付きの `errors`
 */
export const validateExternalUrls = (
  urls: unknown,
): { data: ExternalUrlInput[]; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  const data: ExternalUrlInput[] = [];

  if (urls === undefined || urls === null) return { data, errors };
  if (!Array.isArray(urls)) {
    errors['externalUrls'] = '外部URLは配列で指定してください。';
    return { data, errors };
  }

  for (let i = 0; i < urls.length; i++) {
    const item = urls[i];
    const url = typeof item?.url === 'string' ? item.url.trim() : '';
    const label = typeof item?.label === 'string' ? item.label.trim() : '';

    if (!url) {
      errors[`externalUrls.${i}.url`] = 'URLは必須です。';
    } else if (!URL_PATTERN.test(url)) {
      errors[`externalUrls.${i}.url`] = 'URLはhttp://またはhttps://で始まる必要があります。';
    }

    if (label.length > LIMITS.label) {
      errors[`externalUrls.${i}.label`] = `ラベルは${LIMITS.label}文字以内です。`;
    }

    data.push({ url, label });
  }

  return { data, errors };
};
