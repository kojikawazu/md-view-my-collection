import { CATEGORIES } from '@/constants';

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

type ReportInput = {
  title?: unknown;
  content?: unknown;
  category?: unknown;
  author?: unknown;
  tags?: unknown;
  summary?: unknown;
  publishDate?: unknown;
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

const MAX_TITLE_LENGTH = 200;
const MAX_SUMMARY_LENGTH = 500;
const MAX_CONTENT_LENGTH = 50000;
const MAX_TAG_LENGTH = 50;
const MAX_TAGS_COUNT = 20;
const ALLOWED_CATEGORIES: readonly string[] = CATEGORIES;

const hasField = (input: ReportInput, key: keyof ReportInput) =>
  Object.prototype.hasOwnProperty.call(input, key);

const toStringValue = (value: unknown) => {
  if (typeof value === 'string') return value.trim();
  return '';
};

/**
 * タグの正規化。canonical form は `#` 付き。
 *
 * - 配列入力: 各要素をトリムし、`#` が無ければ付与
 * - 文字列入力: カンマ分割後、各要素をトリムし、`#` が無ければ付与
 *
 * 例: ["AI", "#Cloud"] → ["#AI", "#Cloud"]
 * 例: "AI, Cloud, #Linux" → ["#AI", "#Cloud", "#Linux"]
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
    return value
      .split(',')
      .map(ensureHash)
      .filter(Boolean);
  }
  return [];
};

const parsePublishDate = (value: unknown): Date | null | undefined => {
  if (value === null) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
};

export const validateReportInput = (
  input: ReportInput,
  options: ValidateOptions = {},
): { data: NormalizedReport; errors: ValidationErrors } => {
  const errors: ValidationErrors = {};
  const data: NormalizedReport = {};
  const { partial = false } = options;

  if (!partial || hasField(input, 'title')) {
    const title = toStringValue(input.title);
    if (!title) {
      errors.title = 'タイトルは必須です。';
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.title = `タイトルは${MAX_TITLE_LENGTH}文字以内です。`;
    } else {
      data.title = title;
    }
  }

  if (!partial || hasField(input, 'content')) {
    const content = toStringValue(input.content);
    if (!content) {
      errors.content = '本文は必須です。';
    } else if (content.length > MAX_CONTENT_LENGTH) {
      errors.content = `本文は${MAX_CONTENT_LENGTH}文字以内です。`;
    } else {
      data.content = content;
    }
  }

  if (!partial || hasField(input, 'category')) {
    const category = toStringValue(input.category);
    if (!category) {
      errors.category = 'カテゴリは必須です。';
    } else if (!ALLOWED_CATEGORIES.includes(category)) {
      errors.category = `カテゴリは次のいずれかです: ${ALLOWED_CATEGORIES.join(' / ')}`;
    } else {
      data.category = category;
    }
  }

  if (!partial || hasField(input, 'author')) {
    const author = toStringValue(input.author);
    if (!author) {
      errors.author = '著者は必須です。';
    } else {
      data.author = author;
    }
  }

  if (!partial || hasField(input, 'tags')) {
    const tags = normalizeTags(input.tags);
    if (!partial && tags.length === 0) {
      errors.tags = 'タグは1つ以上必要です。';
    } else if (tags.length > MAX_TAGS_COUNT) {
      errors.tags = `タグは${MAX_TAGS_COUNT}個以内です。`;
    } else {
      const tooLong = tags.find((tag) => tag.length > MAX_TAG_LENGTH);
      if (tooLong) {
        errors.tags = `タグは${MAX_TAG_LENGTH}文字以内です。`;
      } else {
        data.tags = tags;
      }
    }
  }

  if (hasField(input, 'summary')) {
    const summary = toStringValue(input.summary);
    if (summary.length > MAX_SUMMARY_LENGTH) {
      errors.summary = `要約は${MAX_SUMMARY_LENGTH}文字以内です。`;
    } else {
      data.summary = summary || null;
    }
  }

  if (hasField(input, 'publishDate')) {
    const publishDate = parsePublishDate(input.publishDate);
    if (publishDate !== undefined) {
      data.publishDate = publishDate;
    }
  }

  return { data, errors };
};
