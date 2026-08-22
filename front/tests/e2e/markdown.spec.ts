import { test, expect } from '@playwright/test';

import { markdownReportsFixture, setStorage } from './helpers';

/**
 * レポート本文の Markdown 描画に対する回帰検知（Issue #25）。
 *
 * 既存の app.spec.ts は詳細画面の「タイトル・タグ・編集導線」を見ているだけで、
 * 本文が Markdown として描画されていることは検証していなかった。そのため
 * 本文がプレーンテキストに戻る不具合が再発しても CI は緑のまま通り抜ける。
 *
 * ReportMarkdown が担う挙動は 3 層あり、いずれもここで押さえる:
 *   1. 標準記法 + GFM — 壊れると目視で気づけるが、気づくのは本番
 *   2. 独自変換（「・」段落・コールアウト）— 正規表現とテキスト平坦化に依存し壊れやすい
 *   3. サニタイズ — 壊れても見た目は正常なため、テスト以外に検知手段が無い
 */
test.describe('Markdown rendering (detail view)', () => {
  test('TC-037 正常: 主要記法が Markdown として描画される', async ({ page }) => {
    await setStorage(page, { reports: markdownReportsFixture, user: null });
    await page.goto('/report/md-1');

    const article = page.getByRole('article');

    // 見出し: プレーンテキスト表示なら "# Markdown Rendering Check" という
    // 文字列になり、heading ロールを持たないため落ちる
    await expect(
      article.getByRole('heading', { name: 'Markdown Rendering Check', level: 1 }),
    ).toBeVisible();

    // 強調・イタリック・打ち消し線（打ち消しは GFM 由来）
    await expect(article.locator('strong', { hasText: 'bold text' })).toBeVisible();
    await expect(article.locator('em', { hasText: 'italic text' })).toBeVisible();
    await expect(article.locator('del', { hasText: 'struck text' })).toBeVisible();

    // リスト
    await expect(
      article.getByRole('listitem').filter({ hasText: 'List item alpha' }),
    ).toBeVisible();
    await expect(article.getByRole('listitem').filter({ hasText: 'List item beta' })).toBeVisible();

    // 引用
    await expect(article.locator('blockquote', { hasText: 'Quoted sentence.' })).toBeVisible();

    // コードブロック（pre > code であること。inline code と区別する）
    await expect(article.locator('pre code', { hasText: 'const answer = 42;' })).toBeVisible();

    // リンク（href が保持されていること）
    await expect(article.getByRole('link', { name: 'Example link' })).toHaveAttribute(
      'href',
      'https://example.com/md',
    );

    // 画像（alt が保持されていること）
    await expect(article.getByRole('img', { name: 'Alt image text' })).toHaveAttribute(
      'src',
      'https://example.com/image.png',
    );
  });

  test('TC-038 正常: GFM のテーブルが表として描画される', async ({ page }) => {
    await setStorage(page, { reports: markdownReportsFixture, user: null });
    await page.goto('/report/md-1');

    const table = page.getByRole('article').getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Col A' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'a1' })).toBeVisible();
  });

  test('TC-039 正常: 「・」始まりの段落が箇条書きへ変換される', async ({ page }) => {
    await setStorage(page, { reports: markdownReportsFixture, user: null });
    await page.goto('/report/md-1');

    // ReportMarkdown の独自変換（parseDotListItems）。Markdown 標準のリスト記法ではないため、
    // 変換が外れると「・Dot item one」を含む素の段落に戻る
    const dotList = page.getByRole('article').locator('ul.dot-bullet-list');
    await expect(dotList).toBeVisible();
    await expect(dotList.getByRole('listitem')).toHaveCount(2);
    await expect(dotList.getByRole('listitem').first()).toHaveText('Dot item one');
  });

  test('TC-040 正常: 見出し語に応じてコールアウトが付与される', async ({ page }) => {
    await setStorage(page, { reports: markdownReportsFixture, user: null });
    await page.goto('/report/md-1');

    const article = page.getByRole('article');

    // classifyHeading の判定（まとめ / 注意点 / 動向）が h2 セクションを包むこと
    await expect(article.locator('section.report-callout--summary')).toContainText(
      'Summary callout body.',
    );
    await expect(article.locator('section.report-callout--warning')).toContainText(
      'Warning callout body.',
    );
    await expect(article.locator('section.report-callout--trend')).toContainText(
      'Trend callout body.',
    );
  });

  test('TC-041 異常: 生 HTML がサニタイズされ実行されない', async ({ page }) => {
    await setStorage(page, { reports: markdownReportsFixture, user: null });
    await page.goto('/report/md-2');

    const article = page.getByRole('article');

    // 本文が描画されていることの前提確認。以下の toHaveCount(0) は画面に何も出ていなくても
    // 通ってしまうため、この確認が無いと偽の緑になる。
    // 一方で hard にすると、Markdown 描画とサニタイズが同じ変更で同時に壊れたときここで停止し、
    // 本命のサニタイズ検証が一度も評価されない（Issue #187 / 実際に TC-041 で起きた）。
    // soft なら失敗を記録したうえで後続を必ず評価する。
    await expect.soft(article.getByRole('heading', { name: 'Sanitize Check' })).toBeVisible();

    // 本文由来の要素が DOM に注入されていないこと
    await expect(article.locator('script')).toHaveCount(0);
    await expect(article.locator('img[src="x"]')).toHaveCount(0);
    await expect(article.locator('a[href^="javascript:"]')).toHaveCount(0);

    // スクリプトが実行されていないこと（実行されていれば true が入る）。
    // `__xssExecuted` は fixture のペイロードが動いたときだけ生える検証専用のプロパティで
    // 実装側に定義が無いため、Window 型を拡張せずこの場でキャストして読む
    // （型を広げると本番コードから参照できてしまう）。
    const xssExecuted = await page.evaluate(
      () => (window as unknown as { __xssExecuted?: boolean }).__xssExecuted,
    );
    expect(xssExecuted).toBeUndefined();
  });

  test('TC-042 準正常: 本文が未取得のときは本文を描画しない', async ({ page }) => {
    await setStorage(page, { reports: markdownReportsFixture, user: null });
    await page.goto('/report/md-3');

    // タイトル等のメタ情報は表示されるが、本文ブロックは描画されない。
    // 前提確認を soft にする理由は TC-041 と同じ（Issue #187）
    await expect.soft(page.getByRole('heading', { name: 'Markdown Empty' })).toBeVisible();
    await expect(page.getByRole('article').locator('.report-markdown')).toHaveCount(0);
  });
});
