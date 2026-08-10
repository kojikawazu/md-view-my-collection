import { z } from 'zod';
// zod-openapi の型拡張（.meta() で OpenAPI 固有プロパティを許可）。
// type-only import なのでランタイムバンドルには含まれない。
import type {} from 'zod-openapi';
import { CATEGORIES } from '@/constants/report';

/**
 * Report / ExternalUrl の正準 zod スキーマ。
 *
 * - API のリクエスト/レスポンス契約の単一ソース。
 * - 同じスキーマから OpenAPI ドキュメント（`docs/openapi.json`）を生成する。
 * - ランタイム検証は `lib/validation.ts` がこのスキーマを包んで実行する。
 *
 * 既存の寛容な正規化挙動（数値→空文字、タグ `#` 付与、不正日付の無視）は
 * `z.preprocess` で内側に取り込み、サーバーの後方互換を保つ。
 */

/** 各フィールドの文字数・件数の上限。エラーメッセージにも埋め込む単一ソース。 */
export const LIMITS = {
  title: 200,
  summary: 500,
  content: 50000,
  tag: 50,
  tags: 20,
  label: 200,
} as const;

const URL_PATTERN = /^https?:\/\//;

/**
 * 文字列以外は空文字に倒し、文字列はトリムする（既存 validation.ts と同一挙動）。
 *
 * @param value - 任意の入力値
 * @returns トリム済み文字列。文字列でなければ空文字
 */
const toStringValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * タグの正規化。canonical form は `#` 付き。
 * - 配列入力: 各要素をトリムし、`#` が無ければ付与（非文字列要素は除外）
 * - 文字列入力: カンマ分割後、各要素をトリムし、`#` が無ければ付与
 *
 * @param value - タグの配列またはカンマ区切り文字列
 * @returns `#` 付きに正規化したタグ配列（空要素は除外）
 */
export const normalizeTags = (value: unknown): string[] => {
  const ensureHash = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return '';
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  };

  if (Array.isArray(value)) {
    return value
      .filter((tag) => typeof tag === 'string')
      .map(ensureHash)
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map(ensureHash).filter(Boolean);
  }
  return [];
};

/**
 * publishDate を Date | null | undefined に解釈する（不正値は undefined で無視）。
 *
 * @param value - 日付候補（Date / 文字列 / null など）
 * @returns 有効な `Date`、明示的な `null`、または不正・未指定時の `undefined`
 */
const parsePublishDate = (value: unknown): Date | null | undefined => {
  if (value === null) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
};

// --- フィールドスキーマ（リクエスト） ---

const titleSchema = z
  .preprocess(
    toStringValue,
    z
      .string()
      .min(1, 'タイトルは必須です。')
      .max(LIMITS.title, `タイトルは${LIMITS.title}文字以内です。`),
  )
  .meta({
    type: 'string',
    description: 'レポートタイトル',
    example: 'Kubernetes 入門',
    maxLength: LIMITS.title,
  });

const contentSchema = z
  .preprocess(
    toStringValue,
    z
      .string()
      .min(1, '本文は必須です。')
      .max(LIMITS.content, `本文は${LIMITS.content}文字以内です。`),
  )
  .meta({
    type: 'string',
    description: 'Markdown 本文',
    example: '# 見出し\\n\\n本文',
    maxLength: LIMITS.content,
  });

const authorSchema = z
  .preprocess(toStringValue, z.string().min(1, '著者は必須です。'))
  .meta({ type: 'string', description: '著者名', example: 'Editor' });

const categorySchema = z
  .preprocess(
    toStringValue,
    z
      .string()
      .min(1, 'カテゴリは必須です。')
      .refine((value) => (CATEGORIES as readonly string[]).includes(value), {
        message: `カテゴリは次のいずれかです: ${CATEGORIES.join(' / ')}`,
      }),
  )
  .meta({
    type: 'string',
    description: 'カテゴリ（固定リスト）',
    example: 'AI',
    override: { enum: [...CATEGORIES] },
  });

const summarySchema = z
  .preprocess(
    toStringValue,
    z.string().max(LIMITS.summary, `要約は${LIMITS.summary}文字以内です。`),
  )
  // 空文字は null に正規化する
  .transform((value) => (value ? value : null))
  .meta({
    type: 'string',
    description: '要約（空文字は null）',
    example: '記事の要約',
    maxLength: LIMITS.summary,
  });

const publishDateSchema = z
  .preprocess(parsePublishDate, z.union([z.date(), z.null()]).optional())
  .meta({
    type: 'string',
    format: 'date',
    description: '公開日（ISO 文字列 / null）。不正値は無視',
    example: '2024-01-15',
  });

const tagsBaseSchema = z.preprocess(
  normalizeTags,
  z
    .array(z.string())
    .max(LIMITS.tags, `タグは${LIMITS.tags}個以内です。`)
    .refine((tags) => tags.every((tag) => tag.length <= LIMITS.tag), {
      message: `タグは${LIMITS.tag}文字以内です。`,
    }),
);

/** 新規作成: タグは 1 つ以上必須。 */
const tagsCreateSchema = z
  .preprocess(
    normalizeTags,
    z
      .array(z.string())
      .min(1, 'タグは1つ以上必要です。')
      .max(LIMITS.tags, `タグは${LIMITS.tags}個以内です。`)
      .refine((tags) => tags.every((tag) => tag.length <= LIMITS.tag), {
        message: `タグは${LIMITS.tag}文字以内です。`,
      }),
  )
  .meta({
    type: 'array',
    items: { type: 'string' },
    description: 'タグ（`#` 付き canonical）',
    example: ['#AI', '#Cloud'],
  });

/** 更新: タグは省略可・空配列可。 */
const tagsPatchSchema = tagsBaseSchema.meta({
  type: 'array',
  items: { type: 'string' },
  description: 'タグ（`#` 付き canonical / 空配列可）',
  example: ['#AI'],
});

/** 外部 URL 1 件。 */
export const externalUrlInputSchema = z
  .object({
    url: z
      .preprocess(
        toStringValue,
        z
          .string()
          .min(1, 'URLは必須です。')
          .regex(URL_PATTERN, 'URLはhttp://またはhttps://で始まる必要があります。'),
      )
      .meta({ type: 'string', format: 'uri', example: 'https://example.com' }),
    label: z
      .preprocess(
        toStringValue,
        z.string().max(LIMITS.label, `ラベルは${LIMITS.label}文字以内です。`),
      )
      .meta({ type: 'string', example: 'Example', maxLength: LIMITS.label }),
  })
  // preprocess により入力型が unknown になるため、必須フィールドを明示する
  .meta({ id: 'ExternalUrlInput', override: { required: ['url'] } });

/** レポート新規作成リクエスト。 */
export const reportCreateSchema = z
  .object({
    title: titleSchema,
    content: contentSchema,
    category: categorySchema,
    author: authorSchema,
    tags: tagsCreateSchema,
    summary: summarySchema.optional(),
    publishDate: publishDateSchema,
    externalUrls: z.array(externalUrlInputSchema).optional(),
  })
  // preprocess により入力型が unknown になるため、必須フィールドを明示する
  .meta({
    id: 'ReportCreateRequest',
    override: { required: ['title', 'content', 'category', 'author', 'tags'] },
  });

/** レポート更新リクエスト（部分更新）。 */
export const reportPatchSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    category: categorySchema.optional(),
    author: authorSchema.optional(),
    tags: tagsPatchSchema.optional(),
    summary: summarySchema.optional(),
    publishDate: publishDateSchema,
    externalUrls: z.array(externalUrlInputSchema).optional(),
  })
  .meta({ id: 'ReportPatchRequest' });

// --- レスポンススキーマ ---

/** 外部 URL 1 件（レスポンス）。id 付きで label は null 許容。 */
export const externalUrlItemSchema = z
  .object({
    id: z.string().meta({ example: 'eu_123' }),
    url: z.string().meta({ format: 'uri', example: 'https://example.com' }),
    label: z.string().nullable().meta({ example: 'Example' }),
  })
  .meta({ id: 'ExternalUrlItem' });

/** レポート 1 件（レスポンス）。一覧 API では `content` は空文字で返る。 */
export const reportItemSchema = z
  .object({
    id: z.string().meta({ example: 'rep_123' }),
    title: z.string(),
    summary: z.string().nullable(),
    content: z.string().meta({ description: '一覧 API では空文字' }),
    category: z.string().meta({ example: 'AI' }),
    author: z.string().meta({ example: 'Editor' }),
    publishDate: z
      .string()
      .nullable()
      .meta({ format: 'date-time', example: '2024-01-15T00:00:00.000Z' }),
    createdAt: z.string().meta({ format: 'date-time' }),
    updatedAt: z.string().meta({ format: 'date-time' }),
    tags: z.array(z.string()).meta({ example: ['#AI', '#Cloud'] }),
    externalUrls: z.array(externalUrlItemSchema),
  })
  .meta({ id: 'ReportItem' });

/** タグ名の配列（レスポンス）。 */
export const tagListSchema = z
  .array(z.string())
  .meta({ id: 'TagList', example: ['#AI', '#Cloud'] });

/** バリデーションエラーレスポンス（フィールド名 → 日本語メッセージ）。 */
export const validationErrorSchema = z
  .object({ errors: z.record(z.string(), z.string()) })
  .meta({ id: 'ValidationErrorResponse', example: { errors: { title: 'タイトルは必須です。' } } });

/** 汎用エラーレスポンス。 */
export const errorSchema = z
  .object({ error: z.string() })
  .meta({ id: 'ErrorResponse', example: { error: 'Not found' } });

/** レポート新規作成リクエストの推論型。 */
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
/** レポート更新（部分）リクエストの推論型。 */
export type ReportPatchInput = z.infer<typeof reportPatchSchema>;
/** レポート 1 件（レスポンス）の推論型。 */
export type ReportItemOutput = z.infer<typeof reportItemSchema>;
