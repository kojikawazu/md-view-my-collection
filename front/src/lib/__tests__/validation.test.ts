import { describe, expect, it } from 'vitest';
import { validateReportInput, normalizeTags, validateExternalUrls } from '../validation';

describe('validateReportInput', () => {
  const validInput = {
    title: 'Test Report',
    content: '# Hello\n\nWorld',
    category: 'AI',
    author: 'Editor',
    tags: ['#AI', '#Cloud'],
  };

  // --- 正常系 ---

  it('should pass with all required fields valid (N-1)', () => {
    const { data, errors } = validateReportInput(validInput);
    expect(errors).toEqual({});
    expect(data.title).toBe('Test Report');
    expect(data.content).toBe('# Hello\n\nWorld');
    expect(data.category).toBe('AI');
    expect(data.author).toBe('Editor');
    expect(data.tags).toEqual(['#AI', '#Cloud']);
  });

  it('should normalize empty summary to null (N-2)', () => {
    const { data, errors } = validateReportInput({ ...validInput, summary: '' });
    expect(errors.summary).toBeUndefined();
    expect(data.summary).toBeNull();
  });

  it('should parse ISO date string to Date (N-3)', () => {
    const { data } = validateReportInput({ ...validInput, publishDate: '2024-01-15' });
    expect(data.publishDate).toBeInstanceOf(Date);
    expect(data.publishDate!.getFullYear()).toBe(2024);
  });

  it('should keep null publishDate as null (N-4)', () => {
    const { data } = validateReportInput({ ...validInput, publishDate: null });
    expect(data.publishDate).toBeNull();
  });

  it('should validate only provided fields in partial mode (N-5)', () => {
    const { data, errors } = validateReportInput({ title: 'New' }, { partial: true });
    expect(errors).toEqual({});
    expect(data.title).toBe('New');
    expect(data.content).toBeUndefined();
  });

  it('should allow empty tags in partial mode (N-6)', () => {
    const { data, errors } = validateReportInput({ tags: [] }, { partial: true });
    expect(errors.tags).toBeUndefined();
    expect(data.tags).toEqual([]);
  });

  it.each([
    'Development', 'AI', 'Cloud', 'Linux', 'Container', 'Application', 'Program', 'Hobby',
  ])('should accept category "%s" (N-7)', (category) => {
    const { errors } = validateReportInput({ ...validInput, category });
    expect(errors.category).toBeUndefined();
  });

  // --- 準正常系 ---

  it('should error when title is empty (S-1)', () => {
    const { errors } = validateReportInput({ ...validInput, title: '' });
    expect(errors.title).toBe('タイトルは必須です。');
  });

  it('should error when title exceeds 200 chars (S-2)', () => {
    const { errors } = validateReportInput({ ...validInput, title: 'a'.repeat(201) });
    expect(errors.title).toContain('200文字以内');
  });

  it('should pass when title is exactly 200 chars (S-3)', () => {
    const { errors } = validateReportInput({ ...validInput, title: 'a'.repeat(200) });
    expect(errors.title).toBeUndefined();
  });

  it('should error when content is empty (S-4)', () => {
    const { errors } = validateReportInput({ ...validInput, content: '' });
    expect(errors.content).toBe('本文は必須です。');
  });

  it('should error when content exceeds 50000 chars (S-5)', () => {
    const { errors } = validateReportInput({ ...validInput, content: 'a'.repeat(50001) });
    expect(errors.content).toContain('50000文字以内');
  });

  it('should error when category is empty (S-6)', () => {
    const { errors } = validateReportInput({ ...validInput, category: '' });
    expect(errors.category).toBe('カテゴリは必須です。');
  });

  it('should error when category is invalid (S-7)', () => {
    const { errors } = validateReportInput({ ...validInput, category: 'Invalid' });
    expect(errors.category).toContain('次のいずれか');
  });

  it('should error when author is empty (S-8)', () => {
    const { errors } = validateReportInput({ ...validInput, author: '' });
    expect(errors.author).toBe('著者は必須です。');
  });

  it('should error when tags is empty array in non-partial mode (S-9)', () => {
    const { errors } = validateReportInput({ ...validInput, tags: [] });
    expect(errors.tags).toBe('タグは1つ以上必要です。');
  });

  it('should error when tags exceed 20 (S-10)', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `#tag${i}`);
    const { errors } = validateReportInput({ ...validInput, tags });
    expect(errors.tags).toContain('20個以内');
  });

  it('should error when a tag exceeds 50 chars (S-11)', () => {
    const { errors } = validateReportInput({ ...validInput, tags: ['#' + 'a'.repeat(50)] });
    expect(errors.tags).toContain('50文字以内');
  });

  it('should error when summary exceeds 500 chars (S-12)', () => {
    const { errors } = validateReportInput({ ...validInput, summary: 'a'.repeat(501) });
    expect(errors.summary).toContain('500文字以内');
  });

  it('should treat numeric title as empty (S-13)', () => {
    const { errors } = validateReportInput({ ...validInput, title: 123 as unknown as string });
    expect(errors.title).toBe('タイトルは必須です。');
  });

  it('should trim whitespace from title (S-14)', () => {
    const { data, errors } = validateReportInput({ ...validInput, title: '  hello  ' });
    expect(errors.title).toBeUndefined();
    expect(data.title).toBe('hello');
  });

  // --- 異常系 ---

  it('should ignore invalid date string (A-1)', () => {
    const { data } = validateReportInput({ ...validInput, publishDate: 'not-a-date' });
    expect(data.publishDate).toBeUndefined();
  });

  it('should filter non-string elements from tags array (A-2)', () => {
    const { data } = validateReportInput({
      ...validInput,
      tags: ['AI', 123, null] as unknown as string[],
    });
    expect(data.tags).toEqual(['#AI']);
  });
});

describe('normalizeTags', () => {
  it('should normalize comma-separated string with # prefix (NT-1)', () => {
    expect(normalizeTags('AI, Cloud, #Linux')).toEqual(['#AI', '#Cloud', '#Linux']);
  });

  it('should normalize array with # prefix (NT-2)', () => {
    expect(normalizeTags(['AI', '#Cloud'])).toEqual(['#AI', '#Cloud']);
  });

  it('should filter empty/whitespace entries (NT-3)', () => {
    expect(normalizeTags('AI, , ,Cloud')).toEqual(['#AI', '#Cloud']);
  });

  it('should return empty array for non-string/non-array (NT-4)', () => {
    expect(normalizeTags(123)).toEqual([]);
  });

  it('should return empty array for null/undefined (NT-5)', () => {
    expect(normalizeTags(null)).toEqual([]);
    expect(normalizeTags(undefined)).toEqual([]);
  });
});

describe('validateExternalUrls', () => {
  // --- 正常系 ---

  it('should pass with valid URL array (EU-N-1)', () => {
    const { data, errors } = validateExternalUrls([
      { url: 'https://example.com', label: 'Example' },
    ]);
    expect(Object.keys(errors)).toHaveLength(0);
    expect(data).toHaveLength(1);
    expect(data[0].url).toBe('https://example.com');
  });

  it('should allow empty label (EU-N-2)', () => {
    const { errors } = validateExternalUrls([{ url: 'https://example.com', label: '' }]);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should return empty result for null/undefined (EU-N-3)', () => {
    expect(validateExternalUrls(null)).toEqual({ data: [], errors: {} });
    expect(validateExternalUrls(undefined)).toEqual({ data: [], errors: {} });
  });

  it('should allow http:// URLs (EU-N-4)', () => {
    const { errors } = validateExternalUrls([{ url: 'http://example.com', label: '' }]);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  // --- 準正常系 ---

  it('should error when URL is empty (EU-S-1)', () => {
    const { errors } = validateExternalUrls([{ url: '', label: 'test' }]);
    expect(errors['externalUrls.0.url']).toContain('必須');
  });

  it('should error when URL does not start with http/https (EU-S-2)', () => {
    const { errors } = validateExternalUrls([{ url: 'ftp://x.com', label: '' }]);
    expect(errors['externalUrls.0.url']).toContain('http://');
  });

  it('should error when label exceeds 200 chars (EU-S-3)', () => {
    const { errors } = validateExternalUrls([
      { url: 'https://x.com', label: 'a'.repeat(201) },
    ]);
    expect(errors['externalUrls.0.label']).toContain('200文字以内');
  });

  it('should report per-row errors (EU-S-4)', () => {
    const { errors } = validateExternalUrls([
      { url: '', label: '' },
      { url: 'bad', label: '' },
    ]);
    expect(errors['externalUrls.0.url']).toBeDefined();
    expect(errors['externalUrls.1.url']).toBeDefined();
  });

  // --- 異常系 ---

  it('should error when input is not an array (EU-A-1)', () => {
    const { errors } = validateExternalUrls('not-array');
    expect(errors['externalUrls']).toContain('配列で指定');
  });

  it('should treat non-string url/label as empty (EU-A-2)', () => {
    const { data, errors } = validateExternalUrls([{ url: 123, label: null }]);
    expect(errors['externalUrls.0.url']).toBeDefined();
    expect(data[0].url).toBe('');
    expect(data[0].label).toBe('');
  });
});
