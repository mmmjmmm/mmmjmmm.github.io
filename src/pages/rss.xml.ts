import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { SITE } from '../config/site';
import { getPublishedPosts } from '../lib/posts';
import { withBase } from '../lib/urls';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  const site = context.site ?? new URL('http://localhost:4321');
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: new URL(withBase(''), site),
    customData: `<language>${SITE.locale}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? SITE.description,
      pubDate: post.data.publishedAt,
      link: withBase(`posts/${post.id}/`),
      categories: post.data.tags,
    })),
  });
}
