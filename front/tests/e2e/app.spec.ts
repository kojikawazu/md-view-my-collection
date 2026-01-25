import { expect, test } from '@playwright/test';

const reportsFixture = [
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
  },
];

const userFixture = {
  id: '1',
  username: 'tester',
  email: 'tester@example.com',
  role: 'admin' as const,
};

const setStorage = async (
  page: Parameters<typeof test>[0]['page'],
  {
    reports = reportsFixture,
    user = null as typeof userFixture | null,
  }: { reports?: typeof reportsFixture; user?: typeof userFixture | null } = {},
) => {
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

test.describe('Reports app', () => {
  test('TC-001/002: list displays reports and navigates to detail', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/');

    const firstCard = page.locator('article').first();
    await expect(firstCard.getByRole('link', { name: 'Sample Report One' })).toBeVisible();
    await expect(firstCard.getByText('Summary for sample report one.')).toBeVisible();
    await expect(firstCard.getByText('Editor One')).toBeVisible();

    await firstCard.getByRole('link', { name: 'Sample Report One' }).click();
    await expect(page).toHaveURL(/\/report\/1$/);
    await expect(page.getByRole('heading', { name: 'Sample Report One' })).toBeVisible();
  });

  test('TC-003: empty list shows placeholder', async ({ page }) => {
    await setStorage(page, { reports: [], user: null });
    await page.goto('/');
    await expect(page.getByText('No reports found.')).toBeVisible();
  });

  test('TC-004/005/006: detail view handles valid/invalid and hides admin controls', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });

    await page.goto('/report/1');
    await expect(page.getByRole('heading', { name: 'Sample Report One' })).toBeVisible();
    await expect(page.getByText('Editor One')).toBeVisible();
    await expect(page.getByRole('article').getByText('#AI')).toBeVisible();
    await expect(page.getByRole('button', { name: '削除' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: '編集' })).toHaveCount(0);

    await page.goto('/report/unknown');
    await expect(page.getByText('Report Not Found')).toBeVisible();
  });

  test('TC-007/008: login success and empty input stays', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/login');

    await page.getByRole('button', { name: 'Authenticate' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByPlaceholder('Enter your email').fill('tester@example.com');
    await page.getByPlaceholder('Enter your password').fill('password');
    await page.getByRole('button', { name: 'Authenticate' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('navigation').getByText('Manager')).toBeVisible();
  });

  test('TC-009/010: unauth access redirects to login', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });

    await page.goto('/report/new');
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/report/1/edit');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-011/012/013/014: create report with validation and tag normalization', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });
    await page.goto('/report/new');

    const submitButton = page.getByRole('button', { name: 'レポートを投稿' });
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    await expect(page.getByText('レポートの投稿確認')).toHaveCount(0);

    await page.locator('input[name="title"]').fill('New Report');
    await page.locator('textarea[name="summary"]').fill('New summary.');
    await page.locator('textarea[name="content"]').fill('# Title\n\nBody');

    await submitButton.click();
    await expect(page.getByText('タグを入力してください。')).toBeVisible();
    await expect(page.getByText('レポートの投稿確認')).toHaveCount(0);

    await page.locator('input[name="tags"]').fill('a, b, #c');

    await page.getByRole('button', { name: 'レポートを投稿' }).click();
    await expect(page.getByText('レポートの投稿確認')).toBeVisible();
    await page.getByRole('button', { name: '投稿する' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('New Report')).toBeVisible();

    await page.getByRole('link', { name: 'New Report' }).click();
    await expect(page.getByText('#a')).toBeVisible();
    await expect(page.getByText('#b')).toBeVisible();
    await expect(page.getByText('#c')).toBeVisible();
  });

  test('TC-015/016/017: edit prefill and save updates detail', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });
    await page.goto('/report/1/edit');

    await expect(page.locator('input[name="title"]')).toHaveValue('Sample Report One');
    await expect(page.locator('textarea[name="summary"]')).toHaveValue('Summary for sample report one.');

    await page.locator('textarea[name="content"]').fill('# Heading\n\nUpdated content.');
    await page.getByRole('button', { name: '変更を保存' }).click();
    await expect(page.getByText('変更の保存確認')).toBeVisible();
    await page.getByRole('button', { name: '保存する' }).click();

    await expect(page).toHaveURL(/\/report\/1$/);
    await expect(page.getByText('Updated content.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sample Report One' })).toBeVisible();
  });

  test('TC-018/019: delete cancel and confirm', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });
    await page.goto('/report/1');

    await page.getByRole('button', { name: '削除' }).click();
    await expect(page.getByText('レポートの削除')).toBeVisible();
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page).toHaveURL(/\/report\/1$/);

    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Sample Report One' })).toBeVisible();

    await page.goto('/report/1');
    await page.getByRole('button', { name: '削除' }).click();
    await page.getByRole('button', { name: '削除する' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Sample Report One')).toHaveCount(0);
  });

  test('TC-020: logout hides admin controls', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });
    await page.goto('/');

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Authenticate' })).toBeVisible();
    await page.waitForFunction(() => localStorage.getItem('espresso_user') === 'null');

    await page.goto('/report/1');
    await expect(page.getByRole('button', { name: '削除' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: '編集' })).toHaveCount(0);
  });
});
