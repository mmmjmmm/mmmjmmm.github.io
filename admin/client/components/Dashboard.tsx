import { ArrowUpRight, FileText, LogOut, Plus, RefreshCw, Search } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ArticleRecord, ArticleStatus, ArticleSummary } from '../../shared/article';
import { ApiError, getArticle, listArticles, logout, type SessionData } from '../api';

const ArticleEditor = lazy(async () => {
  const module = await import('./ArticleEditor');
  return { default: module.ArticleEditor };
});

interface DashboardProps {
  session: SessionData;
  onUnauthorized: () => void;
}

const statusText: Record<ArticleStatus, string> = {
  published: '已发布',
  draft: '草稿',
  changes: '待发布',
  unpublished: '已撤回',
  invalid: '需修正',
};

function displayDate(value: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(
    new Date(`${value}T00:00:00+08:00`),
  );
}

export function Dashboard({ session, onUnauthorized }: DashboardProps) {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [editorKey, setEditorKey] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [record, setRecord] = useState<ArticleRecord | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [dirty, setDirty] = useState(false);
  const newCounter = useRef(0);
  const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://mmmjmmm.github.io';

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      setArticles(await listArticles());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      setListError(error instanceof Error ? error.message : '文章列表加载失败');
    } finally {
      setLoadingList(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN');
    if (!normalized) return articles;
    return articles.filter((article) =>
      [article.title, article.slug, article.description, ...article.tags]
        .join(' ')
        .toLocaleLowerCase('zh-CN')
        .includes(normalized),
    );
  }, [articles, query]);

  function canLeaveEditor() {
    return !dirty || window.confirm('当前修改还没有保存，确定离开吗？');
  }

  async function openArticle(slug: string) {
    if (slug === selectedSlug && editorKey) return;
    if (!canLeaveEditor()) return;
    setSelectedSlug(slug);
    setEditorKey(`article:${slug}`);
    setRecord(null);
    setDirty(false);
    setLoadingArticle(true);
    try {
      setRecord(await getArticle(slug));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      setListError(error instanceof Error ? error.message : '文章加载失败');
      setEditorKey(null);
      setSelectedSlug(null);
    } finally {
      setLoadingArticle(false);
    }
  }

  function createArticle() {
    if (!canLeaveEditor()) return;
    newCounter.current += 1;
    setSelectedSlug(null);
    setRecord(null);
    setDirty(false);
    setEditorKey(`new:${newCounter.current}`);
  }

  function closeEditor() {
    if (!canLeaveEditor()) return;
    setEditorKey(null);
    setSelectedSlug(null);
    setRecord(null);
    setDirty(false);
  }

  async function handleLogout() {
    if (!canLeaveEditor()) return;
    try {
      await logout(session.csrfToken);
    } finally {
      onUnauthorized();
    }
  }

  function handleSaved(nextRecord: ArticleRecord) {
    setRecord(nextRecord);
    setSelectedSlug(nextRecord.article.slug);
    void refreshList();
  }

  return (
    <div className={`dashboard ${editorKey ? 'dashboard--editing' : ''}`}>
      <header className="admin-header">
        <div className="admin-brand">
          <span>mjm&apos;s blog</span>
          <small>写作后台</small>
        </div>
        <nav className="admin-header__actions" aria-label="后台操作">
          <a href={publicSiteUrl} target="_blank" rel="noreferrer">
            查看网站 <ArrowUpRight size={16} />
          </a>
          <button type="button" onClick={() => void handleLogout()} aria-label="退出登录">
            <LogOut size={17} /> <span>退出</span>
          </button>
        </nav>
      </header>

      <div className="admin-layout">
        <aside className="article-sidebar" aria-label="文章列表">
          <div className="sidebar-heading">
            <div>
              <h1>文章</h1>
              <span>{articles.length} 篇</span>
            </div>
            <button className="new-button" type="button" onClick={createArticle}>
              <Plus size={18} /> 新建
            </button>
          </div>
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <span className="visually-hidden">搜索文章</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题或标签"
            />
          </label>

          <div className="article-list">
            {loadingList && (
              <div className="sidebar-state">
                <span className="skeleton skeleton--title" />
                <span className="skeleton" />
                <span className="skeleton skeleton--short" />
              </div>
            )}
            {!loadingList && listError && (
              <div className="sidebar-state sidebar-state--error">
                <p>{listError}</p>
                <button type="button" onClick={() => void refreshList()}>
                  <RefreshCw size={15} /> 重试
                </button>
              </div>
            )}
            {!loadingList && !listError && filteredArticles.length === 0 && (
              <div className="sidebar-state">
                <FileText size={22} />
                <p>{query ? '没有匹配的文章' : '还没有文章，先写一篇吧。'}</p>
              </div>
            )}
            {!loadingList &&
              !listError &&
              filteredArticles.map((article) => (
                <button
                  className={`article-row ${selectedSlug === article.slug ? 'article-row--active' : ''}`}
                  type="button"
                  key={article.slug}
                  onClick={() => void openArticle(article.slug)}
                >
                  <span className="article-row__top">
                    <strong>{article.title}</strong>
                    <time dateTime={article.updatedAt || article.publishedAt}>
                      {displayDate(article.updatedAt || article.publishedAt)}
                    </time>
                  </span>
                  <span className="article-row__bottom">
                    <span className={`status-dot status-dot--${article.status}`}>
                      {statusText[article.status]}
                    </span>
                    <span className="article-row__slug">/{article.slug}</span>
                  </span>
                </button>
              ))}
          </div>
        </aside>

        <main className="admin-main">
          {loadingArticle && (
            <div className="editor-loading" role="status">
              <RefreshCw className="spin" size={22} /> 正在载入文章…
            </div>
          )}
          {!loadingArticle && editorKey && (
            <Suspense
              fallback={
                <div className="editor-loading">
                  <RefreshCw className="spin" size={22} /> 正在打开编辑器…
                </div>
              }
            >
              <ArticleEditor
                key={editorKey}
                record={record}
                csrfToken={session.csrfToken}
                onBack={closeEditor}
                onSaved={handleSaved}
                onDirtyChange={setDirty}
                onUnauthorized={onUnauthorized}
              />
            </Suspense>
          )}
          {!loadingArticle && !editorKey && (
            <div className="editor-empty">
              <div className="editor-empty__mark">
                <FileText size={24} />
              </div>
              <h2>选择一篇文章继续编辑</h2>
              <p>也可以新建文章，或从本地导入 Markdown 文件。</p>
              <button className="button button--primary" type="button" onClick={createArticle}>
                <Plus size={17} /> 写新文章
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
