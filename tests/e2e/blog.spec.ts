import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page opens with one reading action and scrolls into the article archive', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  const readingGate = page.locator('[data-reading-gate]');
  const startReading = readingGate.getByRole('link', { name: "mjm's blog", exact: true });
  const archive = page.locator('#latest-posts');
  const semanticTitle = page.locator('h1.visually-hidden');

  await expect(semanticTitle).toHaveText('MJM 的技术博客');
  const semanticTitleBox = await semanticTitle.boundingBox();
  expect(semanticTitleBox?.width).toBeLessThanOrEqual(1);
  expect(semanticTitleBox?.height).toBeLessThanOrEqual(1);
  await expect(readingGate).toBeVisible();
  await expect(readingGate).toHaveText(/^\s*mjm's blog\s*$/);
  await expect(readingGate.locator(':is(h1, p, dl)')).toHaveCount(0);
  await expect(startReading).toHaveAttribute('href', '#latest-posts');
  await expect(page.getByRole('link', { name: '欢迎来到我的技术博客', exact: true })).toBeVisible();
  await expect(page.locator('.post-list img')).toHaveCount(0);

  await readingGate.evaluate((gate) => {
    const observedStates: string[] = [];
    Object.defineProperty(window, '__readingGateStates', {
      configurable: true,
      value: observedStates,
    });
    new MutationObserver(() =>
      observedStates.push(gate.getAttribute('data-scroll-state') ?? ''),
    ).observe(gate, { attributeFilter: ['data-scroll-state'] });
  });
  await startReading.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expect(archive).toHaveAttribute('data-scroll-state', 'arrived');
  await expect(page).toHaveURL(/#latest-posts$/);
  expect(
    await page.evaluate(() => {
      const states = Reflect.get(window, '__readingGateStates');
      return Array.isArray(states) && states.includes('departing');
    }),
  ).toBe(true);
});

test('article pages use a compact header, wide reading column, and no related section', async ({
  page,
  isMobile,
}) => {
  await page.goto('/posts/welcome/');

  await expect(page.getByRole('heading', { level: 1, name: '欢迎来到我的技术博客' })).toBeVisible();
  await expect(page.getByText(/ARTICLE|NOTE|技术文章|学习笔记/)).toHaveCount(0);
  await expect(page.locator('.article-header__description')).toBeVisible();
  await expect(page.locator('.article-header .article-meta')).toBeVisible();
  await expect(page.locator('.article-header .tag-list')).toBeVisible();

  const headerMetrics = await page.locator('.article-header').evaluate((header) => {
    const heading = header.querySelector('h1');
    if (!heading) throw new Error('Article heading is missing');
    const headerStyle = getComputedStyle(header);
    return {
      backgroundImage: headerStyle.backgroundImage,
      borderRadius: Number.parseFloat(headerStyle.borderTopLeftRadius),
      fontSize: Number.parseFloat(getComputedStyle(heading).fontSize),
      height: header.getBoundingClientRect().height,
    };
  });
  expect(headerMetrics.backgroundImage).toBe('none');
  expect(headerMetrics.borderRadius).toBe(0);
  expect(headerMetrics.fontSize).toBeLessThanOrEqual(isMobile ? 40 : 64);
  expect(headerMetrics.height).toBeLessThan(isMobile ? 430 : 360);

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

    const readingWidth = await page.evaluate(() => {
      const article = document.querySelector<HTMLElement>('.article');
      const prose = document.querySelector<HTMLElement>('.prose');
      if (!article || !prose) throw new Error('Reading layout is missing');
      return prose.getBoundingClientRect().width / article.getBoundingClientRect().width;
    });
    expect(readingWidth).toBeGreaterThanOrEqual(0.78);
    expect(readingWidth).toBeLessThanOrEqual(0.82);
  }
  await expect(page.getByRole('button', { name: '复制代码' })).toBeVisible();
  await expect(page.getByRole('button', { name: '复制“为什么写博客”小节链接' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '相关文章' })).toHaveCount(0);
  await expect(page.locator('.related-posts')).toHaveCount(0);
});

test('archive headings keep a restrained scale', async ({ page, isMobile }) => {
  await page.goto('/');

  const sectionTitleSize = await page
    .getByRole('heading', { level: 2, name: '最新文章' })
    .evaluate((heading) => Number.parseFloat(getComputedStyle(heading).fontSize));
  const postTitleSize = await page
    .locator('.post-row h2')
    .first()
    .evaluate((heading) => Number.parseFloat(getComputedStyle(heading).fontSize));

  expect(sectionTitleSize).toBeLessThanOrEqual(isMobile ? 40 : 48);
  expect(postTitleSize).toBeLessThanOrEqual(isMobile ? 30 : 34);
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
