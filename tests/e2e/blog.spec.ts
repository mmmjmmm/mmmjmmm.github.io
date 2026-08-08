import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page presents the text-only article archive', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: '把复杂的技术，写成清楚的笔记。' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '欢迎来到我的技术博客', exact: true })).toBeVisible();
  await expect(page.locator('.post-list img')).toHaveCount(0);
});

test('an article has metadata, a responsive table of contents, and copyable links and code', async ({
  page,
  isMobile,
}) => {
  await page.goto('/posts/welcome/');

  await expect(page.getByRole('heading', { level: 1, name: '欢迎来到我的技术博客' })).toBeVisible();
  await expect(page.getByText(/ARTICLE \/ 技术文章/)).toBeVisible();
  if (isMobile) {
    const mobileToc = page.locator('details.mobile-toc');
    await expect(mobileToc).toBeVisible();
    await expect(mobileToc.getByRole('navigation', { name: '本文目录' })).toBeHidden();
    await mobileToc.locator('summary').click();
    await expect(mobileToc.getByRole('navigation', { name: '本文目录' })).toBeVisible();
  } else {
    await expect(
      page.locator('.desktop-toc').getByRole('navigation', { name: '本文目录' }),
    ).toBeVisible();
  }
  await expect(page.getByRole('button', { name: '复制代码' })).toBeVisible();
  await expect(page.getByRole('button', { name: '复制“为什么写博客”小节链接' })).toBeVisible();
  const related = page.getByRole('region', { name: '相关文章' });
  await expect(related).toBeVisible();
  await expect(related.getByRole('link', { name: /如何在这个博客发布一篇文章/ })).toBeVisible();
});

test('theme selection is persisted', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /切换到深色模式/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('static search finds an article by tag', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '搜索' }).click();
  await page.getByRole('searchbox', { name: '搜索文章' }).fill('Astro');
  await expect(
    page.getByRole('dialog').getByRole('link', { name: /欢迎来到我的技术博客/ }),
  ).toBeVisible();
});

test('the not-found page offers search recovery', async ({ page }) => {
  await page.goto('/missing-page/');
  await expect(page.getByRole('heading', { name: '这篇笔记 好像还没写。' })).toBeVisible();
  await page.getByRole('button', { name: '搜索文章' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('the home page has no serious accessibility violations or horizontal overflow', async ({
  page,
}) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
