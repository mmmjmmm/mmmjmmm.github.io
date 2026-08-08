import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({
    base: './src/content/posts',
    pattern: '**/*.{md,mdx}',
    generateId: ({ entry }) => entry.replace(/\/index\.(md|mdx)$/u, '').replace(/\.(md|mdx)$/u, ''),
  }),
  schema: z
    .object({
      title: z.string().min(1).max(100),
      description: z.string().min(10).max(200),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      type: z.enum(['article', 'note']),
      tags: z
        .array(z.string().trim().min(1).max(30))
        .min(1)
        .max(8)
        .refine(
          (tags) =>
            new Set(tags.map((tag) => tag.normalize('NFKC').toLocaleLowerCase('zh-CN'))).size ===
            tags.length,
          '同一篇文章内的 tags 不得重复',
        ),
      draft: z.boolean(),
    })
    .refine(({ publishedAt, updatedAt }) => !updatedAt || updatedAt >= publishedAt, {
      message: 'updatedAt 不能早于 publishedAt',
      path: ['updatedAt'],
    }),
});

export const collections = { posts };
