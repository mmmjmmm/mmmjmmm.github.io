import {
  articleInputSchema,
  importMarkdown,
  parseStoredArticle,
  serializeArticle,
  type ArticleInput,
  type ArticleRecord,
  type ArticleStatus,
  type ArticleSummary,
  type DeploymentStatus,
  type PublicationResult,
} from '../shared/article.js';
import type { AdminConfig } from './config.js';
import { AppError, errorMessage } from './errors.js';
import { GitHubRepository, type RepositoryFile } from './github.js';

const DRAFT_ROOT = '.blog-admin/drafts';
const PUBLISHED_ROOT = 'src/content/posts';
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export interface ExpectedVersions {
  draftSha: string | null;
  publishedSha: string | null;
}

interface ParsedFile {
  file: RepositoryFile;
  article: ArticleInput;
  draft: boolean;
  valid: boolean;
}

function assertSlug(slug: string) {
  if (!slugPattern.test(slug) || slug.length > 80) {
    throw new AppError('文章地址无效', 400, 'INVALID_SLUG');
  }
}

function draftPath(slug: string) {
  assertSlug(slug);
  return `${DRAFT_ROOT}/${slug}.md`;
}

function publishedPath(slug: string) {
  assertSlug(slug);
  return `${PUBLISHED_ROOT}/${slug}/index.md`;
}

function parseFile(file: RepositoryFile, slug: string): ParsedFile {
  try {
    const parsed = parseStoredArticle(file.content, slug);
    const { draft, ...article } = parsed;
    return { file, article, draft, valid: true };
  } catch {
    return {
      file,
      article: importMarkdown(file.content, slug),
      draft: false,
      valid: false,
    };
  }
}

function sameArticle(left: ArticleInput, right: ArticleInput) {
  try {
    return serializeArticle(left, false) === serializeArticle(right, false);
  } catch {
    return false;
  }
}

function articleStatus(draft: ParsedFile | null, published: ParsedFile | null): ArticleStatus {
  if ((draft && !draft.valid) || (published && !published.valid)) return 'invalid';
  if (draft) {
    if (!published) return 'draft';
    if (published.draft) return 'unpublished';
    return sameArticle(draft.article, published.article) ? 'published' : 'changes';
  }
  if (!published) return 'draft';
  return published.draft ? 'unpublished' : 'published';
}

async function assertVersion(
  repository: GitHubRepository,
  path: string,
  branch: string,
  expectedSha: string | null,
) {
  const current = await repository.getFile(path, branch);
  if ((current?.sha ?? null) !== expectedSha) {
    throw new AppError('这篇文章已在其他设备上修改，请刷新后再继续', 409, 'CONTENT_CONFLICT');
  }
  return current;
}

export class PublishingService {
  private readonly repository: GitHubRepository;

  constructor(private readonly config: AdminConfig) {
    this.repository = new GitHubRepository(config);
  }

  private async getFiles(slug: string) {
    const [draft, published] = await Promise.all([
      this.repository.getFile(draftPath(slug), this.config.githubDraftBranch),
      this.repository.getFile(publishedPath(slug), this.config.githubMainBranch),
    ]);
    return {
      draft: draft ? parseFile(draft, slug) : null,
      published: published ? parseFile(published, slug) : null,
    };
  }

  async listArticles(): Promise<ArticleSummary[]> {
    const [draftEntries, publishedEntries] = await Promise.all([
      this.repository.listFiles(this.config.githubDraftBranch, `${DRAFT_ROOT}/`),
      this.repository.listFiles(this.config.githubMainBranch, `${PUBLISHED_ROOT}/`),
    ]);

    const draftSlugs = draftEntries
      .map(({ path }) => path.match(/^\.blog-admin\/drafts\/([a-z0-9-]+)\.md$/u)?.[1])
      .filter((slug): slug is string => Boolean(slug));
    const publishedSlugs = publishedEntries
      .map(({ path }) => path.match(/^src\/content\/posts\/([a-z0-9-]+)\/index\.md$/u)?.[1])
      .filter((slug): slug is string => Boolean(slug));
    const slugs = [...new Set([...draftSlugs, ...publishedSlugs])];

    const summaries = await Promise.all(
      slugs.map(async (slug): Promise<ArticleSummary> => {
        const { draft, published } = await this.getFiles(slug);
        const preferred = draft ?? published;
        if (!preferred) throw new AppError(`无法读取文章 ${slug}`, 502, 'GITHUB_CONTENT');
        return {
          slug,
          title: preferred.article.title || slug,
          description: preferred.article.description,
          publishedAt: preferred.article.publishedAt,
          updatedAt: preferred.article.updatedAt,
          tags: preferred.article.tags,
          status: articleStatus(draft, published),
          hasPublishedVersion: Boolean(published && !published.draft),
          hasDraftVersion: Boolean(draft),
        };
      }),
    );

    return summaries.toSorted((left, right) => {
      const dateOrder = (right.updatedAt || right.publishedAt).localeCompare(
        left.updatedAt || left.publishedAt,
      );
      return dateOrder || left.title.localeCompare(right.title, 'zh-CN');
    });
  }

  async getArticle(slug: string): Promise<ArticleRecord> {
    assertSlug(slug);
    const { draft, published } = await this.getFiles(slug);
    const preferred = draft ?? published;
    if (!preferred) throw new AppError('没有找到这篇文章', 404, 'ARTICLE_NOT_FOUND');
    return {
      article: preferred.article,
      status: articleStatus(draft, published),
      draftSha: draft?.file.sha ?? null,
      publishedSha: published?.file.sha ?? null,
    };
  }

  private validateArticle(slug: string, input: ArticleInput) {
    const article = articleInputSchema.parse(input);
    if (article.slug !== slug) {
      throw new AppError('文章地址与请求不一致', 400, 'SLUG_MISMATCH');
    }
    return article;
  }

  async saveDraft(slug: string, input: ArticleInput, versions: ExpectedVersions) {
    const article = this.validateArticle(slug, input);
    await this.repository.ensureBranch(this.config.githubDraftBranch, this.config.githubMainBranch);
    const [draft, published] = await Promise.all([
      assertVersion(
        this.repository,
        draftPath(slug),
        this.config.githubDraftBranch,
        versions.draftSha,
      ),
      assertVersion(
        this.repository,
        publishedPath(slug),
        this.config.githubMainBranch,
        versions.publishedSha,
      ),
    ]);
    const commitSha = await this.repository.putFile(
      draftPath(slug),
      this.config.githubDraftBranch,
      serializeArticle(article, true),
      `draft: save ${slug}`,
      draft?.sha ?? null,
    );
    return { commitSha };
  }

  async publish(
    slug: string,
    input: ArticleInput,
    versions: ExpectedVersions,
  ): Promise<PublicationResult> {
    const article = this.validateArticle(slug, input);
    const [draft, published] = await Promise.all([
      assertVersion(
        this.repository,
        draftPath(slug),
        this.config.githubDraftBranch,
        versions.draftSha,
      ),
      assertVersion(
        this.repository,
        publishedPath(slug),
        this.config.githubMainBranch,
        versions.publishedSha,
      ),
    ]);
    const commitSha = await this.repository.putFile(
      publishedPath(slug),
      this.config.githubMainBranch,
      serializeArticle(article, false),
      `publish: ${article.title}`,
      published?.sha ?? null,
    );

    let warning: string | undefined;
    if (draft) {
      try {
        await this.repository.deleteFile(
          draftPath(slug),
          this.config.githubDraftBranch,
          draft.sha,
          `draft: clean up ${slug}`,
        );
      } catch (error) {
        warning = `文章已发布，但旧草稿未能清理：${errorMessage(error)}`;
      }
    }

    return {
      commitSha,
      articleUrl: `${this.config.publicSiteUrl}/posts/${encodeURIComponent(slug)}/`,
      ...(warning ? { warning } : {}),
    };
  }

  async unpublish(
    slug: string,
    input: ArticleInput,
    versions: ExpectedVersions,
  ): Promise<PublicationResult> {
    const article = this.validateArticle(slug, input);
    if (!versions.publishedSha) {
      throw new AppError('这篇文章还没有发布', 400, 'ARTICLE_NOT_PUBLISHED');
    }
    await this.repository.ensureBranch(this.config.githubDraftBranch, this.config.githubMainBranch);
    const [draft, published] = await Promise.all([
      assertVersion(
        this.repository,
        draftPath(slug),
        this.config.githubDraftBranch,
        versions.draftSha,
      ),
      assertVersion(
        this.repository,
        publishedPath(slug),
        this.config.githubMainBranch,
        versions.publishedSha,
      ),
    ]);
    if (!published) throw new AppError('这篇文章还没有发布', 400, 'ARTICLE_NOT_PUBLISHED');

    await this.repository.putFile(
      draftPath(slug),
      this.config.githubDraftBranch,
      serializeArticle(article, true),
      `draft: preserve ${slug} before unpublishing`,
      draft?.sha ?? null,
    );
    const commitSha = await this.repository.putFile(
      publishedPath(slug),
      this.config.githubMainBranch,
      serializeArticle(article, true),
      `unpublish: ${article.title}`,
      published.sha,
    );
    return {
      commitSha,
      articleUrl: `${this.config.publicSiteUrl}/posts/${encodeURIComponent(slug)}/`,
    };
  }

  async deployment(commitSha: string): Promise<DeploymentStatus> {
    if (!/^[a-f0-9]{40}$/u.test(commitSha)) {
      throw new AppError('提交编号无效', 400, 'INVALID_COMMIT_SHA');
    }
    const run = await this.repository.getWorkflowRun(commitSha);
    if (!run) {
      return { state: 'waiting', runUrl: null, message: '等待 GitHub 开始部署' };
    }
    if (run.status !== 'completed') {
      const state = run.status === 'in_progress' ? 'in_progress' : 'queued';
      return {
        state,
        runUrl: run.html_url,
        message: state === 'in_progress' ? '正在部署' : '排队中',
      };
    }
    if (run.conclusion === 'success') {
      return { state: 'success', runUrl: run.html_url, message: '网站已更新' };
    }
    return {
      state: 'failure',
      runUrl: run.html_url,
      message: `部署未成功（${run.conclusion ?? '未知原因'}）`,
    };
  }
}
