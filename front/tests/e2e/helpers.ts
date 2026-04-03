import { test } from '@playwright/test';

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
  page: Parameters<typeof test>[0]['page'],
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
