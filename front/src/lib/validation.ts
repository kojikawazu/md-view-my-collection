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

export type ValidationErrors = {
  title?: string;
  content?: string;
  category?: string;
  author?: string;
  tags?: string;
  summary?: string;
};

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
