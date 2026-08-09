import { parse, stringify } from 'yaml';
import { z } from 'zod';

const datePattern = /^\d{4}-\d{2}-\d{2}$/u;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function isValidDate(value: string) {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export const articleInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1, '请填写文章地址')
      .max(80, '文章地址最多 80 个字符')
      .regex(slugPattern, '文章地址只能包含小写英文、数字和连字符'),
    title: z.string().trim().min(1, '请填写标题').max(100, '标题最多 100 个字符'),
    description: z
      .string()
      .trim()
      .max(200, '简介最多 200 个字符')
      .refine((value) => value.length === 0 || value.length >= 10, '简介至少 10 个字符'),
    publishedAt: z.string().refine(isValidDate, '请填写有效的发布日期'),
    updatedAt: z
      .string()
      .refine((value) => value.length === 0 || isValidDate(value), '请填写有效的更新日期'),
    type: z.enum(['article', 'note']),
    tags: z
      .array(z.string().trim().min(1).max(30))
      .min(1, '至少填写一个标签')
      .max(8, '最多填写 8 个标签')
      .refine(
        (tags) =>
          new Set(tags.map((tag) => tag.normalize('NFKC').toLocaleLowerCase('zh-CN'))).size ===
          tags.length,
        '标签不能重复',
      ),
    body: z
      .string()
      .trim()
      .min(1, '请填写正文')
      .refine(
        (value) => new TextEncoder().encode(value).byteLength <= 900_000,
        '正文不能超过 900 KB',
      ),
  })
  .refine(({ publishedAt, updatedAt }) => !updatedAt || updatedAt >= publishedAt, {
    message: '更新日期不能早于发布日期',
    path: ['updatedAt'],
  });

export type ArticleInput = z.infer<typeof articleInputSchema>;
export type ArticleStatus = 'published' | 'draft' | 'changes' | 'unpublished' | 'invalid';

export interface ArticleSummary {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  status: ArticleStatus;
  hasPublishedVersion: boolean;
  hasDraftVersion: boolean;
}

export interface ArticleRecord {
  article: ArticleInput;
  status: ArticleStatus;
  draftSha: string | null;
  publishedSha: string | null;
}

export interface PublicationResult {
  commitSha: string;
  articleUrl: string;
  warning?: string;
}

export interface DeploymentStatus {
  state: 'waiting' | 'queued' | 'in_progress' | 'success' | 'failure';
  runUrl: string | null;
  message: string;
}

function frontmatterParts(markdown: string) {
  const normalized = markdown.replace(/^\uFEFF/u, '').replace(/\r\n?/gu, '\n');
  const match = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/u);
  if (!match) return { attributes: {} as Record<string, unknown>, body: normalized.trim() };

  const parsed = parse(match[1]);
  return {
    attributes: parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {},
    body: match[2].trim(),
  };
}

function dateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function todayInShanghai() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function emptyArticle(): ArticleInput {
  return {
    slug: '',
    title: '',
    description: '',
    publishedAt: todayInShanghai(),
    updatedAt: '',
    type: 'note',
    tags: [],
    body: '',
  };
}

export function importMarkdown(markdown: string, fallbackSlug = ''): ArticleInput {
  const { attributes, body } = frontmatterParts(markdown);
  const heading = body.match(/^#\s+(.+)$/mu)?.[1]?.trim() ?? '';
  const tags = Array.isArray(attributes.tags)
    ? attributes.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];

  return {
    slug: stringValue(attributes.slug) || fallbackSlug,
    title: stringValue(attributes.title) || heading,
    description: stringValue(attributes.description),
    publishedAt: dateValue(attributes.publishedAt) || todayInShanghai(),
    updatedAt: dateValue(attributes.updatedAt),
    type: attributes.type === 'article' ? 'article' : 'note',
    tags,
    body,
  };
}

export function parseStoredArticle(
  markdown: string,
  slug: string,
): ArticleInput & { draft: boolean } {
  const { attributes, body } = frontmatterParts(markdown);
  const parsed = articleInputSchema.parse({
    slug,
    title: stringValue(attributes.title),
    description: stringValue(attributes.description),
    publishedAt: dateValue(attributes.publishedAt),
    updatedAt: dateValue(attributes.updatedAt),
    type: attributes.type,
    tags: attributes.tags,
    body,
  });

  return { ...parsed, draft: attributes.draft === true };
}

export function serializeArticle(article: ArticleInput, draft: boolean) {
  const value = articleInputSchema.parse(article);
  const attributes: Record<string, unknown> = {
    title: value.title,
  };

  if (value.description) attributes.description = value.description;
  attributes.publishedAt = value.publishedAt;
  if (value.updatedAt) attributes.updatedAt = value.updatedAt;
  attributes.type = value.type;
  attributes.tags = value.tags;
  attributes.draft = draft;

  return `---\n${stringify(attributes, { lineWidth: 0 }).trim()}\n---\n\n${value.body.trim()}\n`;
}

export function slugFromFileName(fileName: string) {
  return fileName
    .replace(/\.(?:md|mdx)$/iu, '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/-{2,}/gu, '-')
    .replace(/^-|-$/gu, '')
    .slice(0, 80);
}
