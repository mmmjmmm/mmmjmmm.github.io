export type BlogPostLike = {
  id: string;
  data: {
    title: string;
    description: string;
    publishedAt: Date;
    updatedAt?: Date;
    draft?: boolean;
    tags: string[];
  };
};

export function sortPublishedPosts<T extends BlogPostLike>(
  posts: readonly T[],
  includeUnpublished = false,
  now = new Date(),
) {
  return posts
    .filter(
      ({ data }) =>
        includeUnpublished || (!data.draft && data.publishedAt.getTime() <= now.getTime()),
    )
    .toSorted((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export function paginatePosts<T>(items: readonly T[], requestedPage: number, pageSize: number) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError('pageSize must be a positive integer');
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}

export function tagSlug(tag: string) {
  const slug = tag
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('zh-CN')
    .replace(/\+/g, ' plus ')
    .replace(/#/g, ' sharp ')
    .replace(/&/g, ' and ')
    .replace(/\//g, ' slash ')
    .replace(/\./g, ' dot ')
    .replace(/[\s_]+/gu, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'tag';
}

export function findRelatedPosts<T extends BlogPostLike>(
  currentPost: T,
  posts: readonly T[],
  limit = 3,
) {
  const currentTags = new Set(currentPost.data.tags.map(tagSlug));

  return posts
    .filter(({ id }) => id !== currentPost.id)
    .map((post) => ({
      post,
      sharedTags: post.data.tags.reduce(
        (count, tag) => count + (currentTags.has(tagSlug(tag)) ? 1 : 0),
        0,
      ),
    }))
    .filter(({ sharedTags }) => sharedTags > 0)
    .toSorted(
      (a, b) =>
        b.sharedTags - a.sharedTags ||
        b.post.data.publishedAt.getTime() - a.post.data.publishedAt.getTime(),
    )
    .slice(0, Math.max(0, limit))
    .map(({ post }) => post);
}

export function collectTags<T extends BlogPostLike>(posts: readonly T[]) {
  const tags = new Map<string, { name: string; slug: string; count: number }>();

  for (const post of posts) {
    for (const rawName of new Set(post.data.tags.map((tag) => tag.trim()).filter(Boolean))) {
      const slug = tagSlug(rawName);
      const current = tags.get(slug);
      tags.set(
        slug,
        current ? { ...current, count: current.count + 1 } : { name: rawName, slug, count: 1 },
      );
    }
  }

  return [...tags.values()].sort(
    (a, b) => b.count - a.count || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
  );
}

export function estimateReadingTime(markdown: string, charactersPerMinute = 500) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_[\]()-]/g, ' ');
  const cjkCharacters =
    plainText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)
      ?.length ?? 0;
  const latinWords =
    plainText
      .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ')
      .match(/[\p{Letter}\p{Number}]+(?:['’-][\p{Letter}\p{Number}]+)*/gu)?.length ?? 0;

  return Math.max(1, Math.ceil((cjkCharacters + latinWords * 2) / charactersPerMinute));
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
