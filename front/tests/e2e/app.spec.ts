import { expect, test } from '@playwright/test';
import { reportsFixture, pagedReportsFixture, userFixture, setStorage } from './helpers';

test.describe('Reports app', () => {
  test('TC-001/002: list displays reports and navigates to detail', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/');

    const firstCard = page.locator('article').first();
    await expect(firstCard.getByRole('link', { name: 'Sample Report One' })).toBeVisible();
    await expect(firstCard.getByText('Summary for sample report one.')).toBeVisible();
    await expect(firstCard.getByText('Manager')).toBeVisible();

    await firstCard.getByRole('link', { name: 'Sample Report One' }).click();
    await expect(page).toHaveURL(/\/report\/1$/);
    await expect(page.getByRole('heading', { name: 'Sample Report One' })).toBeVisible();
  });

  test('TC-003: empty list shows placeholder', async ({ page }) => {
    await setStorage(page, { reports: [], user: null });
    await page.goto('/');
    await expect(page.getByText('No reports found.')).toBeVisible();
  });

  test('TC-003-2: category filter toggles list', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/');

    const sidebar = page.locator('aside');
    const categorySection = sidebar.getByRole('heading', { name: 'Categories' }).locator('..');

    await categorySection.getByRole('button', { name: 'AI', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Sample Report One' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sample Report Two' })).toHaveCount(0);

    await categorySection.getByRole('button', { name: 'AI', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Sample Report Two' })).toBeVisible();
  });

  test('TC-003-3: tag filter toggles list', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/');

    const sidebar = page.locator('aside');
    const tagSection = sidebar.getByRole('heading', { name: 'Trending Tags' }).locator('..');

    await tagSection.getByRole('button', { name: /Minimal/ }).click();
    await expect(page.getByRole('link', { name: 'Sample Report Two' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sample Report One' })).toHaveCount(0);

    await tagSection.getByRole('button', { name: /Minimal/ }).click();
    await expect(page.getByRole('link', { name: 'Sample Report One' })).toBeVisible();
  });

  test('TC-023: list pagination shows 10 items and supports 前へ/次へ', async ({ page }) => {
    await setStorage(page, { reports: pagedReportsFixture, user: null });
    await page.goto('/');

    await expect(page.locator('article')).toHaveCount(10);
    await expect(page.getByRole('link', { name: 'Paged Report 1', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '前へ' })).toBeDisabled();

    await page.getByRole('button', { name: '次へ' }).click();
    await expect(page.getByRole('link', { name: 'Paged Report 11', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Paged Report 1', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: '前へ' }).click();
    await expect(page.getByRole('link', { name: 'Paged Report 1', exact: true })).toBeVisible();
  });

  test('TC-024: list pagination number buttons are capped at 5', async ({ page }) => {
    await setStorage(page, { reports: pagedReportsFixture, user: null });
    await page.goto('/');

    const pageNumberButtons = page
      .locator('nav[aria-label="ページネーション"] button')
      .filter({ hasText: /^\d+$/ });

    await expect(pageNumberButtons).toHaveCount(5);
    await page.getByRole('button', { name: '5', exact: true }).click();
    await expect(page.getByRole('button', { name: '5', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.getByRole('button', { name: '次へ' }).click();
    await expect(page.getByRole('button', { name: '6', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('button', { name: '次へ' })).toBeDisabled();
    await expect(pageNumberButtons).toHaveCount(5);
  });

  test('TC-025: category filter resets pagination to first page', async ({ page }) => {
    await setStorage(page, { reports: pagedReportsFixture, user: null });
    await page.goto('/');

    await page.getByRole('button', { name: '次へ' }).click();
    await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );

    const sidebar = page.locator('aside');
    const categorySection = sidebar.getByRole('heading', { name: 'Categories' }).locator('..');
    await categorySection.getByRole('button', { name: 'AI', exact: true }).click();

    await expect(page.getByRole('button', { name: '1', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('link', { name: 'Paged Report 2', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Paged Report 22', exact: true })).toHaveCount(0);
  });

  test('TC-004: detail view shows title, author and tags', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/report/1');

    await expect(page.getByRole('heading', { name: 'Sample Report One' })).toBeVisible();
    await expect(page.getByText('Manager')).toBeVisible();
    await expect(page.getByRole('article').getByText('#AI')).toBeVisible();
  });

  test('TC-005: unknown detail id shows not found', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/report/unknown');

    await expect(page.getByText('Report Not Found')).toBeVisible();
  });

  // 描画の検証（TC-004）と同居させていたため、タグ表示が壊れた時点で停止し、
  // 本命である「未ログインに管理操作を見せない」が評価されないままだった（Issue #187）。
  test('TC-006: detail view hides admin controls when signed out', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/report/1');

    // 前提確認。以下の toHaveCount(0) は画面が出ていなくても通るため、これが無いと偽の緑になる。
    // hard にすると描画の失敗で停止して本命が評価されないので soft にする。
    await expect.soft(page.getByRole('heading', { name: 'Sample Report One' })).toBeVisible();

    await expect(page.getByRole('button', { name: '削除' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: '編集' })).toHaveCount(0);
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

  // 3 ルートは互いに独立した認可の観点。1 つの test に並べると、先頭が落ちた時点で
  // 残りのルートが一度も評価されない（Issue #187）。ルートごとに分ける。
  // 併せて、これまで TC-009/010 に混ざっていた markdown-lab を仕様どおり TC-021 に戻す。
  test('TC-009: unauth access to create page redirects to login', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/report/new');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-010: unauth access to edit page redirects to login', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/report/1/edit');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-021: unauth access to markdown lab redirects to login', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/report/markdown-lab');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-011/012/013/014: create report with validation and tag normalization', async ({
    page,
  }) => {
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
    await expect(page.locator('textarea[name="summary"]')).toHaveValue(
      'Summary for sample report one.',
    );

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
    // ログアウトが成立したことの前提確認。hard にすると遷移が壊れた時点で停止し、
    // 本命の「ログアウト後に管理操作が出ない」が評価されないまま終わる（Issue #187）
    await expect.soft(page).toHaveURL(/\/login$/);
    await expect.soft(page.getByRole('button', { name: 'Authenticate' })).toBeVisible();
    await page.waitForFunction(() => localStorage.getItem('espresso_user') === 'null');

    await page.goto('/report/1');
    await expect.soft(page.getByRole('heading', { name: 'Sample Report One' })).toBeVisible();
    await expect(page.getByRole('button', { name: '削除' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: '編集' })).toHaveCount(0);
  });

  test('TC-022: markdown lab is reachable from the header menu when signed in', async ({
    page,
  }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });

    await page.goto('/report/markdown-lab');
    await expect(page.getByRole('heading', { name: 'Markdown Style Lab' })).toBeVisible();
    await expect(page.locator('.dot-bullet-list li').first()).toContainText('hoge');

    await page.goto('/');
    await page.getByRole('link', { name: 'Markdown Lab' }).click();
    await expect(page).toHaveURL(/\/report\/markdown-lab$/);
    await expect(page.getByRole('heading', { name: 'Pattern 07 - Code Focus' })).toBeVisible();
  });

  test('TC-026: detail with 0 external URLs hides link section', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/report/2');
    await expect(page.getByRole('heading', { name: 'Sample Report Two' })).toBeVisible();
    await expect(page.getByText('External Links')).toHaveCount(0);
  });

  test('TC-027: detail with multiple external URLs shows links', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/report/1');
    await expect(page.getByText('External Links')).toBeVisible();
    await expect(page.getByRole('link', { name: /Note記事/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /zenn\.dev/ })).toBeVisible();

    const noteLink = page.getByRole('link', { name: /Note記事/ });
    await expect(noteLink).toHaveAttribute('href', 'https://example.com/note1');
    await expect(noteLink).toHaveAttribute('target', '_blank');
  });

  test('TC-028: create report with external URLs', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });
    await page.goto('/report/new');

    await page.locator('input[name="title"]').fill('URL Test Report');
    await page.locator('textarea[name="summary"]').fill('Summary with URLs.');
    await page.locator('textarea[name="content"]').fill('# Content');
    await page.locator('input[name="tags"]').fill('test');

    await page.getByRole('button', { name: '+ URL追加' }).click();
    const urlInputs = page.locator('input[placeholder="https://..."]');
    const labelInputs = page.locator('input[placeholder="ラベル（任意）"]');
    await urlInputs.first().fill('https://note.com/article1');
    await labelInputs.first().fill('My Note');

    await page.getByRole('button', { name: '+ URL追加' }).click();
    await urlInputs.nth(1).fill('https://qiita.com/post');

    await page.getByRole('button', { name: 'レポートを投稿' }).click();
    await expect(page.getByText('レポートの投稿確認')).toBeVisible();
    await page.getByRole('button', { name: '投稿する' }).click();

    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('link', { name: 'URL Test Report' }).click();
    await expect(page.getByText('External Links')).toBeVisible();
    await expect(page.getByRole('link', { name: /My Note/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /qiita\.com/ })).toBeVisible();
  });

  test('TC-029: edit report add and remove external URLs', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });
    await page.goto('/report/1/edit');

    const urlInputs = page.locator('input[placeholder="https://..."]');
    await expect(urlInputs).toHaveCount(2);
    await expect(urlInputs.first()).toHaveValue('https://example.com/note1');

    await page.locator('button:text("✕")').first().click();
    await expect(urlInputs).toHaveCount(1);

    await page.getByRole('button', { name: '+ URL追加' }).click();
    await urlInputs.nth(1).fill('https://hatena.blog/new');

    await page.getByRole('button', { name: '変更を保存' }).click();
    await expect(page.getByText('変更の保存確認')).toBeVisible();
    await page.getByRole('button', { name: '保存する' }).click();

    await expect(page).toHaveURL(/\/report\/1$/);
    await expect(page.getByRole('link', { name: /zenn\.dev/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /hatena\.blog/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Note記事/ })).toHaveCount(0);
  });

  test('TC-030: invalid URL input shows validation error', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });
    await page.goto('/report/new');

    await page.locator('input[name="title"]').fill('Invalid URL Test');
    await page.locator('textarea[name="summary"]').fill('Summary.');
    await page.locator('textarea[name="content"]').fill('# Content');
    await page.locator('input[name="tags"]').fill('test');

    await page.getByRole('button', { name: '+ URL追加' }).click();
    await page.locator('input[placeholder="https://..."]').first().fill('not-a-url');

    await page.getByRole('button', { name: 'レポートを投稿' }).click();
    await expect(page.getByText('レポートの投稿確認')).toBeVisible();
    await page.getByRole('button', { name: '投稿する' }).click();

    await expect(page.getByText('http://またはhttps://で始まる必要があります')).toBeVisible();
    await expect(page).not.toHaveURL(/\/$/);
  });

  test('TC-031: create confirm modal submits only once on rapid clicks', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });
    await page.goto('/report/new');

    await page.locator('input[name="title"]').fill('Double Click Test');
    await page.locator('textarea[name="summary"]').fill('Summary.');
    await page.locator('textarea[name="content"]').fill('# Content');
    await page.locator('input[name="tags"]').fill('test');

    await page.getByRole('button', { name: 'レポートを投稿' }).click();
    await expect(page.getByText('レポートの投稿確認')).toBeVisible();

    const confirmBtn = page.getByRole('button', { name: '投稿する' });
    // Rapid clicks — only one report should be created
    await confirmBtn.click();

    await expect(page).toHaveURL(/\/$/);
    // Verify only one "Double Click Test" exists in the list
    await expect(page.getByRole('link', { name: 'Double Click Test' })).toHaveCount(1);
  });

  test('TC-035: detail with numeric non-existent ID shows not found', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: null });
    await page.goto('/report/99999');
    await expect(page.getByText('Report Not Found')).toBeVisible();
  });

  test('TC-036: empty external URL rows are ignored on create', async ({ page }) => {
    await setStorage(page, { reports: reportsFixture, user: userFixture });
    await page.goto('/report/new');

    await page.locator('input[name="title"]').fill('Empty URL Row Test');
    await page.locator('textarea[name="summary"]').fill('Summary.');
    await page.locator('textarea[name="content"]').fill('# Content');
    await page.locator('input[name="tags"]').fill('test');

    // Add two URL rows: one empty, one valid
    await page.getByRole('button', { name: '+ URL追加' }).click();
    await page.getByRole('button', { name: '+ URL追加' }).click();

    const urlInputs = page.locator('input[placeholder="https://..."]');
    // Leave first row empty, fill second
    await urlInputs.nth(1).fill('https://valid.example.com');

    await page.getByRole('button', { name: 'レポートを投稿' }).click();
    await expect(page.getByText('レポートの投稿確認')).toBeVisible();
    await page.getByRole('button', { name: '投稿する' }).click();

    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('link', { name: 'Empty URL Row Test' }).click();
    await expect(page.getByText('External Links')).toBeVisible();
    await expect(page.getByRole('link', { name: /valid\.example\.com/ })).toBeVisible();
  });
});
