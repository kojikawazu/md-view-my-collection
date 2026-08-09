import type { Page } from '@playwright/test';

export const AUTH_COOKIE_NAME = 'report_viewer_auth';
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export const reportsFixture = [
  {
    id: '1',
    title: 'Sample Report One',
    summary: 'Summary for sample report one.',
    content: '# Heading\n\nSome content.\n\n- Point A\n- Point B',
    category: 'AI',
    author: 'Editor One',
    publishDate: '2024-11-20',
    createdAt: '2024-11-20T00:00:00.000Z',
    tags: ['#AI', '#UIUX'],
    externalUrls: [
      { id: 'eu-1', url: 'https://example.com/note1', label: 'Note記事' },
      { id: 'eu-2', url: 'https://zenn.dev/sample', label: null },
    ],
  },
  {
    id: '2',
    title: 'Sample Report Two',
    summary: 'Summary for sample report two.',
    content: '## Subheading\n\nMore details here.',
    category: 'Development',
    author: 'Editor Two',
    publishDate: '2024-11-18',
    createdAt: '2024-11-18T00:00:00.000Z',
    tags: ['#Minimal'],
    externalUrls: [],
  },
];

// Markdown 描画の回帰検知用 fixture（TC-037〜TC-042）。
// 本文には ReportMarkdown が担う 3 層の挙動をすべて含める:
//   1. 標準記法 + GFM（react-markdown / remark-gfm）
//   2. 独自変換（「・」段落 → ul.dot-bullet-list、h2 の語句 → コールアウト）
//   3. サニタイズ（rehype-sanitize。生 HTML を実行させない）
// 記法を削ると対応する TC が意味を失うため、内容の変更時は markdown.spec.ts を必ず併せて見る。
const MARKDOWN_SHOWCASE_CONTENT = [
  '# Markdown Rendering Check',
  '',
  '**bold text** and *italic text* and ~~struck text~~.',
  '',
  '- List item alpha',
  '- List item beta',
  '',
  '> Quoted sentence.',
  '',
  '```ts',
  'const answer = 42;',
  '```',
  '',
  '[Example link](https://example.com/md)',
  '',
  '![Alt image text](https://example.com/image.png)',
  '',
  '| Col A | Col B |',
  '| --- | --- |',
  '| a1 | b1 |',
  '',
  // 全角中点始まりの段落。1 段落内の全行が「・」で始まる場合のみ ul へ変換される
  '・Dot item one',
  '・Dot item two',
  '',
  '## まとめ',
  '',
  'Summary callout body.',
  '',
  '## 注意点',
  '',
  'Warning callout body.',
  '',
  '## 動向',
  '',
  'Trend callout body.',
].join('\n');

// サニタイズ検証用の本文。生 HTML が実行されないことを確認する。
// `window.__xssExecuted` は成功時にも定義されない（＝スクリプトが動いていない証拠）。
const MARKDOWN_RAW_HTML_CONTENT = [
  '# Sanitize Check',
  '',
  '<script>window.__xssExecuted = true;</script>',
  '',
  '<img src="x" onerror="window.__xssExecuted = true;">',
  '',
  '<a href="javascript:window.__xssExecuted = true;">javascript link</a>',
].join('\n');

export const markdownReportsFixture = [
  {
    id: 'md-1',
    title: 'Markdown Showcase',
    summary: 'Covers every markdown notation the viewer must render.',
    content: MARKDOWN_SHOWCASE_CONTENT,
    category: 'Development',
    author: 'Editor Markdown',
    publishDate: '2024-12-01',
    createdAt: '2024-12-01T00:00:00.000Z',
    tags: ['#Markdown'],
    externalUrls: [],
  },
  {
    id: 'md-2',
    title: 'Markdown Sanitize',
    summary: 'Raw HTML must never be executed.',
    content: MARKDOWN_RAW_HTML_CONTENT,
    category: 'Development',
    author: 'Editor Markdown',
    publishDate: '2024-12-02',
    createdAt: '2024-12-02T00:00:00.000Z',
    tags: ['#Markdown'],
    externalUrls: [],
  },
  {
    id: 'md-3',
    title: 'Markdown Empty',
    summary: 'Body is not fetched yet.',
    content: '',
    category: 'Development',
    author: 'Editor Markdown',
    publishDate: '2024-12-03',
    createdAt: '2024-12-03T00:00:00.000Z',
    tags: ['#Markdown'],
    externalUrls: [],
  },
];

export const createPagedReportsFixture = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const order = index + 1;
    const day = String((order % 28) + 1).padStart(2, '0');
    return {
      id: `p-${order}`,
      title: `Paged Report ${order}`,
      summary: `Summary for paged report ${order}.`,
      content: `# Paged ${order}\n\nContent ${order}.`,
      category: order % 2 === 0 ? 'AI' : 'Development',
      author: `Editor ${order}`,
      publishDate: `2024-12-${day}`,
      createdAt: `2024-12-${day}T00:00:00.000Z`,
      tags: order % 2 === 0 ? ['#AI'] : ['#Minimal'],
      externalUrls: [],
    };
  });

export const pagedReportsFixture = createPagedReportsFixture(60);

export const userFixture = {
  id: '1',
  username: 'tester',
  email: 'tester@example.com',
  role: 'admin' as const,
};

export const setStorage = async (
  page: Page,
  {
    reports = reportsFixture,
    user = null as typeof userFixture | null,
  }: { reports?: typeof reportsFixture; user?: typeof userFixture | null } = {},
) => {
  if (user) {
    await page.context().addCookies([
      {
        name: AUTH_COOKIE_NAME,
        value: '1',
        url: BASE_URL,
      },
    ]);
  }

  await page.addInitScript(
    ({ reportsData, userData }) => {
      if (sessionStorage.getItem('seeded') === 'true') return;
      localStorage.clear();
      localStorage.setItem('espresso_reports', JSON.stringify(reportsData));
      localStorage.setItem('espresso_user', JSON.stringify(userData));
      sessionStorage.setItem('seeded', 'true');
    },
    { reportsData: reports, userData: user },
  );
};
