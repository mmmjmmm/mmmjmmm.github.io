import { getCollection, type CollectionEntry } from 'astro:content';

import { collectTags, countWords, estimateReadingTime, sortPublishedPosts, tagSlug } from './blog';

export async function getPublishedPosts() {
  const posts = await getCollection('posts');
  return sortPublishedPosts(posts, import.meta.env.DEV);
}

export function getReadingTime(post: CollectionEntry<'posts'>) {
  return estimateReadingTime(post.body ?? '');
}

export function getWordCount(post: CollectionEntry<'posts'>) {
  return countWords(post.body ?? '');
}

export function getTagIndex(posts: readonly CollectionEntry<'posts'>[]) {
  return collectTags(posts);
}

export function postsWithTag(posts: readonly CollectionEntry<'posts'>[], slug: string) {
  return posts.filter(({ data }) => data.tags.some((tag) => tagSlug(tag) === slug));
}
