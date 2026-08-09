import type { AdminConfig } from './config.js';
import { AppError } from './errors.js';

interface GitHubErrorBody {
  message?: string;
  documentation_url?: string;
}

interface GitHubRef {
  object: { sha: string };
}

interface GitHubTree {
  truncated: boolean;
  tree: Array<{ path: string; type: 'blob' | 'tree'; sha: string }>;
}

interface GitHubContent {
  type: 'file';
  path: string;
  sha: string;
  content: string;
  encoding: 'base64';
}

interface GitHubCommitResponse {
  commit: { sha: string };
  content: { sha: string } | null;
}

interface GitHubWorkflowRuns {
  workflow_runs: Array<{
    id: number;
    status: 'queued' | 'in_progress' | 'completed' | 'requested' | 'waiting' | 'pending';
    conclusion: string | null;
    html_url: string;
    name: string;
  }>;
}

export interface RepositoryFile {
  path: string;
  sha: string;
  content: string;
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function githubError(status: number, body: GitHubErrorBody) {
  if (status === 401) return new AppError('GitHub 凭证无效', 502, 'GITHUB_AUTH');
  if (status === 403) {
    return new AppError('GitHub 拒绝了请求，请检查 Token 权限或频率限制', 502, 'GITHUB_FORBIDDEN');
  }
  if (status === 409 || status === 422) {
    return new AppError('远端内容已经变化，请刷新文章后再试', 409, 'CONTENT_CONFLICT');
  }
  return new AppError(body.message || `GitHub 请求失败（${status}）`, 502, 'GITHUB_ERROR');
}

export class GitHubRepository {
  private readonly repositoryPath: string;

  constructor(private readonly config: AdminConfig) {
    this.repositoryPath = `/repos/${encodeURIComponent(config.githubOwner)}/${encodeURIComponent(config.githubRepo)}`;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    options: { allowNotFound?: boolean } = {},
  ): Promise<T | null> {
    let response: Response;
    try {
      response = await fetch(`https://api.github.com${path}`, {
        ...init,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.config.githubToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'mjm-blog-admin',
          'X-GitHub-Api-Version': '2026-03-10',
          ...init.headers,
        },
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      throw new AppError(
        `暂时无法连接 GitHub：${error instanceof Error ? error.message : '网络错误'}`,
        502,
        'GITHUB_NETWORK',
      );
    }

    if (response.status === 404 && options.allowNotFound) return null;
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as GitHubErrorBody;
      throw githubError(response.status, body);
    }
    if (response.status === 204) return null;
    return (await response.json()) as T;
  }

  async getBranchSha(branch: string) {
    const reference = await this.request<GitHubRef>(
      `${this.repositoryPath}/git/ref/heads/${encodeURIComponent(branch)}`,
      {},
      { allowNotFound: true },
    );
    return reference?.object.sha ?? null;
  }

  async ensureBranch(branch: string, sourceBranch: string) {
    const existing = await this.getBranchSha(branch);
    if (existing) return existing;

    const sourceSha = await this.getBranchSha(sourceBranch);
    if (!sourceSha) throw new AppError(`找不到 ${sourceBranch} 分支`, 502, 'GITHUB_BRANCH');

    try {
      await this.request(`${this.repositoryPath}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: sourceSha }),
      });
      return sourceSha;
    } catch (error) {
      if (error instanceof AppError && error.code === 'CONTENT_CONFLICT') {
        const created = await this.getBranchSha(branch);
        if (created) return created;
      }
      throw error;
    }
  }

  async listFiles(branch: string, prefix: string) {
    const branchSha = await this.getBranchSha(branch);
    if (!branchSha) return [];
    const tree = await this.request<GitHubTree>(
      `${this.repositoryPath}/git/trees/${branchSha}?recursive=1`,
    );
    if (!tree) return [];
    if (tree.truncated) {
      throw new AppError('仓库文件过多，GitHub 返回的目录不完整', 502, 'GITHUB_TREE_TRUNCATED');
    }
    return tree.tree.filter((entry) => entry.type === 'blob' && entry.path.startsWith(prefix));
  }

  async getFile(path: string, branch: string): Promise<RepositoryFile | null> {
    const query = new URLSearchParams({ ref: branch });
    const file = await this.request<GitHubContent>(
      `${this.repositoryPath}/contents/${encodePath(path)}?${query}`,
      {},
      { allowNotFound: true },
    );
    if (!file) return null;
    if (file.type !== 'file' || file.encoding !== 'base64') {
      throw new AppError(`无法读取 ${path}`, 502, 'GITHUB_CONTENT');
    }
    return {
      path: file.path,
      sha: file.sha,
      content: Buffer.from(file.content.replace(/\s/gu, ''), 'base64').toString('utf8'),
    };
  }

  async putFile(
    path: string,
    branch: string,
    content: string,
    message: string,
    currentSha: string | null,
  ) {
    const response = await this.request<GitHubCommitResponse>(
      `${this.repositoryPath}/contents/${encodePath(path)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString('base64'),
          branch,
          ...(currentSha ? { sha: currentSha } : {}),
        }),
      },
    );
    if (!response) throw new AppError('GitHub 没有返回提交结果', 502, 'GITHUB_EMPTY_RESPONSE');
    return response.commit.sha;
  }

  async deleteFile(path: string, branch: string, sha: string, message: string) {
    const response = await this.request<GitHubCommitResponse>(
      `${this.repositoryPath}/contents/${encodePath(path)}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ message, sha, branch }),
      },
    );
    if (!response) throw new AppError('GitHub 没有返回提交结果', 502, 'GITHUB_EMPTY_RESPONSE');
    return response.commit.sha;
  }

  async getWorkflowRun(commitSha: string) {
    const query = new URLSearchParams({ head_sha: commitSha, per_page: '10' });
    const result = await this.request<GitHubWorkflowRuns>(
      `${this.repositoryPath}/actions/runs?${query}`,
    );
    return result?.workflow_runs[0] ?? null;
  }
}
