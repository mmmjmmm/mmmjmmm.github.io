import type {
  ArticleInput,
  ArticleRecord,
  ArticleSummary,
  DeploymentStatus,
  PublicationResult,
} from '../shared/article';

export interface SessionData {
  username: string;
  csrfToken: string;
}

export interface ArticleVersions {
  draftSha: string | null;
  publishedSha: string | null;
}

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = 'UNKNOWN_ERROR',
    readonly details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit = {}, csrfToken?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('网络连接失败，请检查网络后重试', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new ApiError(
      payload.error?.message ?? `请求失败（${response.status}）`,
      response.status,
      payload.error?.code,
      payload.error?.details,
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function getSession() {
  return request<SessionData>('/api/session');
}

export function login(username: string, password: string) {
  return request<SessionData>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logout(csrfToken: string) {
  return request<void>('/api/auth/logout', { method: 'POST' }, csrfToken);
}

export async function listArticles() {
  const result = await request<{ articles: ArticleSummary[] }>('/api/posts');
  return result.articles;
}

export function getArticle(slug: string) {
  return request<ArticleRecord>(`/api/posts/${encodeURIComponent(slug)}`);
}

function actionBody(article: ArticleInput, versions: ArticleVersions) {
  return JSON.stringify({ article, ...versions });
}

export function saveDraft(article: ArticleInput, versions: ArticleVersions, csrfToken: string) {
  return request<{ commitSha: string }>(
    `/api/posts/${encodeURIComponent(article.slug)}/draft`,
    { method: 'PUT', body: actionBody(article, versions) },
    csrfToken,
  );
}

export function publishArticle(
  article: ArticleInput,
  versions: ArticleVersions,
  csrfToken: string,
) {
  return request<PublicationResult>(
    `/api/posts/${encodeURIComponent(article.slug)}/publish`,
    { method: 'POST', body: actionBody(article, versions) },
    csrfToken,
  );
}

export function unpublishArticle(
  article: ArticleInput,
  versions: ArticleVersions,
  csrfToken: string,
) {
  return request<PublicationResult>(
    `/api/posts/${encodeURIComponent(article.slug)}/unpublish`,
    { method: 'POST', body: actionBody(article, versions) },
    csrfToken,
  );
}

export function getDeployment(commitSha: string) {
  return request<DeploymentStatus>(`/api/deployments/${encodeURIComponent(commitSha)}`);
}
