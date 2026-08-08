import { describe, expect, it } from 'vitest';

import {
  collectTags,
  estimateReadingTime,
  findRelatedPosts,
  formatDate,
  paginatePosts,
  sortPublishedPosts,
  tagSlug,
} from './blog';

const post = (
  id: string,
  publishedAt: string,
  options: { draft?: boolean; tags?: string[] } = {},
) => ({
  id,
  data: {
    title: id,
    description: `${id} description`,
    publishedAt: new Date(publishedAt),
    draft: options.draft ?? false,
    tags: options.tags ?? [],
  },
});

describe('sortPublishedPosts', () => {
  it('removes drafts and sorts newest first without mutating input', () => {
    const input = [
      post('old', '2025-01-01'),
      post('draft', '2026-03-01', { draft: true }),
      post('new', '2026-02-01'),
    ];

    expect(sortPublishedPosts(input).map(({ id }) => id)).toEqual(['new', 'old']);
    expect(input.map(({ id }) => id)).toEqual(['old', 'draft', 'new']);
  });

  it('keeps future-dated posts out of production results', () => {
    const input = [post('published', '2026-08-08'), post('scheduled', '2026-08-10')];

    expect(
      sortPublishedPosts(input, false, new Date('2026-08-09T00:00:00Z')).map(({ id }) => id),
    ).toEqual(['published']);
    expect(
      sortPublishedPosts(input, true, new Date('2026-08-09T00:00:00Z')).map(({ id }) => id),
    ).toEqual(['scheduled', 'published']);
  });
});

describe('paginatePosts', () => {
  it('returns a bounded page and useful pagination metadata', () => {
    const posts = Array.from({ length: 9 }, (_, index) => post(`post-${index + 1}`, '2026-01-01'));
    const result = paginatePosts(posts, 2, 4);

    expect(result.items.map(({ id }) => id)).toEqual(['post-5', 'post-6', 'post-7', 'post-8']);
    expect(result).toMatchObject({
      currentPage: 2,
      totalPages: 3,
      hasPrevious: true,
      hasNext: true,
    });
  });
});

describe('tags', () => {
  it('normalizes safe slugs and counts tags across posts', () => {
    const posts = [
      post('a', '2026-01-01', { tags: ['TypeScript', '学习 笔记'] }),
      post('b', '2026-01-01', { tags: ['TypeScript', 'Astro'] }),
    ];

    expect(tagSlug(' 学习 笔记 ')).toBe('学习-笔记');
    expect(tagSlug('C++')).toBe('c-plus-plus');
    expect(tagSlug('C#')).toBe('c-sharp');
    expect(collectTags(posts)).toEqual([
      { name: 'TypeScript', slug: 'typescript', count: 2 },
      { name: 'Astro', slug: 'astro', count: 1 },
      { name: '学习 笔记', slug: '学习-笔记', count: 1 },
    ]);
  });

  it('keeps punctuation-significant technical tags separate', () => {
    const posts = [
      post('cpp', '2026-01-01', { tags: ['C++'] }),
      post('csharp', '2026-01-01', { tags: ['C#'] }),
    ];

    expect(collectTags(posts)).toEqual([
      { name: 'C++', slug: 'c-plus-plus', count: 1 },
      { name: 'C#', slug: 'c-sharp', count: 1 },
    ]);
  });
});

describe('findRelatedPosts', () => {
  it('ranks posts by shared tags and excludes the current post', () => {
    const current = post('current', '2026-01-03', { tags: ['Astro', 'TypeScript'] });
    const close = post('close', '2026-01-01', { tags: ['Astro', 'TypeScript'] });
    const partial = post('partial', '2026-01-02', { tags: ['Astro'] });
    const unrelated = post('unrelated', '2026-01-04', { tags: ['CSS'] });

    expect(
      findRelatedPosts(current, [current, partial, unrelated, close]).map(({ id }) => id),
    ).toEqual(['close', 'partial']);
  });
});

describe('article metadata', () => {
  it('estimates Chinese reading time with a one-minute floor', () => {
    expect(estimateReadingTime('很短的一篇文章')).toBe(1);
    expect(estimateReadingTime('字'.repeat(501))).toBe(2);
  });

  it('formats dates consistently in Chinese', () => {
    expect(formatDate(new Date('2026-08-08T00:00:00+08:00'))).toBe('2026年8月8日');
  });
});
