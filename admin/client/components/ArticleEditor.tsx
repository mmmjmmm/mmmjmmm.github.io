import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import {
  ArrowLeft,
  CloudUpload,
  ExternalLink,
  FileUp,
  LoaderCircle,
  RefreshCw,
  Save,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  articleInputSchema,
  emptyArticle,
  importMarkdown,
  slugFromFileName,
  type ArticleInput,
  type ArticleRecord,
  type ArticleStatus,
  type DeploymentStatus,
  type PublicationResult,
} from '../../shared/article';
import {
  ApiError,
  getArticle,
  getDeployment,
  publishArticle,
  saveDraft,
  unpublishArticle,
  type ArticleVersions,
} from '../api';
import { MarkdownPreview } from './MarkdownPreview';

type ViewMode = 'write' | 'preview' | 'split';
type FieldErrors = Partial<Record<keyof ArticleInput, string>>;

interface RecoveryValue {
  article: ArticleInput;
  savedAt: number;
}

interface ArticleEditorProps {
  record: ArticleRecord | null;
  csrfToken: string;
  onBack: () => void;
  onSaved: (record: ArticleRecord) => void;
  onDirtyChange: (dirty: boolean) => void;
  onUnauthorized: () => void;
}

const statusText: Record<ArticleStatus, string> = {
  published: '已发布',
  draft: '草稿',
  changes: '有未发布修改',
  unpublished: '已撤回',
  invalid: '需要修正',
};

function readRecovery(key: string, initial: ArticleInput): RecoveryValue | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<RecoveryValue>;
    if (!value.article || typeof value.savedAt !== 'number') return null;
    const candidate = value.article as Partial<ArticleInput>;
    if (
      typeof candidate.slug !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.description !== 'string' ||
      typeof candidate.publishedAt !== 'string' ||
      typeof candidate.updatedAt !== 'string' ||
      !['article', 'note'].includes(candidate.type ?? '') ||
      !Array.isArray(candidate.tags) ||
      !candidate.tags.every((tag) => typeof tag === 'string') ||
      typeof candidate.body !== 'string'
    ) {
      return null;
    }
    if (JSON.stringify(value.article) === JSON.stringify(initial)) return null;
    return value as RecoveryValue;
  } catch {
    return null;
  }
}

function clearRecovery(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Publishing must still succeed when browser storage is unavailable.
  }
}

function articleStats(body: string) {
  const chinese = body.match(/[\p{Script=Han}]/gu)?.length ?? 0;
  const words =
    body
      .replace(/[\p{Script=Han}]/gu, ' ')
      .match(/[\p{Letter}\p{Number}]+(?:['’-][\p{Letter}\p{Number}]+)*/gu)?.length ?? 0;
  const count = chinese + words;
  return { count, minutes: Math.max(1, Math.ceil(count / 400)) };
}

function errorMap(error: unknown): FieldErrors {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== 'object')
    return {};
  const fieldErrors = (error.details as { fieldErrors?: Record<string, string[]> }).fieldErrors;
  if (!fieldErrors) return {};
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => messages?.[0])
      .map(([field, messages]) => [field, messages[0]]),
  ) as FieldErrors;
}

export function ArticleEditor({
  record,
  csrfToken,
  onBack,
  onSaved,
  onDirtyChange,
  onUnauthorized,
}: ArticleEditorProps) {
  const initialArticle = useMemo(() => record?.article ?? emptyArticle(), [record]);
  const initialVersions = useMemo<ArticleVersions>(
    () => ({ draftSha: record?.draftSha ?? null, publishedSha: record?.publishedSha ?? null }),
    [record],
  );
  const recoveryKey = useMemo(
    () => `mjm-blog-admin:recovery:${record?.article.slug || 'new'}`,
    [record],
  );
  const [article, setArticle] = useState(initialArticle);
  const [versions, setVersions] = useState(initialVersions);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initialArticle));
  const [tagText, setTagText] = useState(initialArticle.tags.join('，'));
  const [status, setStatus] = useState<ArticleStatus>(record?.status ?? 'draft');
  const [view, setView] = useState<ViewMode>('write');
  const [busy, setBusy] = useState<'draft' | 'publish' | 'unpublish' | ''>('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [publication, setPublication] = useState<PublicationResult | null>(null);
  const [publicationAction, setPublicationAction] = useState<'publish' | 'unpublish' | null>(null);
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null);
  const [recovery, setRecovery] = useState(() => readRecovery(recoveryKey, initialArticle));
  const fileInput = useRef<HTMLInputElement>(null);
  const editorExtensions = useMemo(
    () => [markdown(), EditorView.contentAttributes.of({ 'aria-label': 'Markdown 正文编辑器' })],
    [],
  );
  const dirty = JSON.stringify(article) !== baseline;
  const stats = useMemo(() => articleStats(article.body), [article.body]);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  useEffect(() => {
    if (recovery) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          recoveryKey,
          JSON.stringify({ article, savedAt: Date.now() } satisfies RecoveryValue),
        );
      } catch {
        // Some mobile privacy modes disable localStorage; remote save still works.
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [article, recovery, recoveryKey]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty]);

  useEffect(() => {
    if (!publication) return;
    let cancelled = false;
    let timer = 0;
    let attempts = 0;

    async function poll() {
      try {
        const next = await getDeployment(publication!.commitSha);
        if (cancelled) return;
        setDeployment(next);
        attempts += 1;
        if (!['success', 'failure'].includes(next.state) && attempts < 80) {
          timer = window.setTimeout(poll, 3_000);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized();
          return;
        }
        if (error instanceof ApiError && error.code !== 'NETWORK_ERROR') {
          setDeployment({ state: 'failure', runUrl: null, message: error.message });
          return;
        }
        if (!cancelled && attempts < 80) {
          attempts += 1;
          timer = window.setTimeout(poll, 5_000);
        } else if (!cancelled) {
          setDeployment({
            state: 'failure',
            runUrl: null,
            message: '暂时无法读取部署状态，请稍后查看网站',
          });
        }
      }
    }

    timer = window.setTimeout(poll, 1_500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [publication, onUnauthorized]);

  function update<K extends keyof ArticleInput>(field: K, value: ArticleInput[K]) {
    setArticle((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage('');
  }

  function validate() {
    const result = articleInputSchema.safeParse(article);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const nextErrors = Object.fromEntries(
      Object.entries(result.error.flatten().fieldErrors)
        .filter(([, values]) => values?.[0])
        .map(([field, values]) => [field, values![0]]),
    ) as FieldErrors;
    setErrors(nextErrors);
    setMessage('请先修正标红的内容');
    const firstField = Object.keys(nextErrors)[0];
    document.querySelector<HTMLElement>(`[data-field="${firstField}"]`)?.focus();
    return null;
  }

  async function refreshRecord(slug: string) {
    const refreshed = await getArticle(slug);
    setArticle(refreshed.article);
    setTagText(refreshed.article.tags.join('，'));
    setVersions({ draftSha: refreshed.draftSha, publishedSha: refreshed.publishedSha });
    setStatus(refreshed.status);
    setBaseline(JSON.stringify(refreshed.article));
    clearRecovery(recoveryKey);
    onSaved(refreshed);
    return refreshed;
  }

  async function runAction(action: 'draft' | 'publish' | 'unpublish') {
    const validArticle = validate();
    if (!validArticle) return;
    if (
      action === 'unpublish' &&
      !window.confirm('确定撤回这篇文章吗？撤回后网站会重新部署，文章将不再公开。')
    ) {
      return;
    }

    setBusy(action);
    setMessage('');
    setConflict(false);
    setPublication(null);
    setPublicationAction(null);
    setDeployment(null);
    try {
      if (action === 'draft') {
        await saveDraft(validArticle, versions, csrfToken);
        await refreshRecord(validArticle.slug);
        setMessage('草稿已保存到 GitHub');
      } else {
        const result =
          action === 'publish'
            ? await publishArticle(validArticle, versions, csrfToken)
            : await unpublishArticle(validArticle, versions, csrfToken);
        setPublication(result);
        setPublicationAction(action);
        setDeployment({
          state: 'waiting',
          runUrl: null,
          message: action === 'publish' ? '已提交发布，等待网站部署' : '已提交撤回，等待网站部署',
        });
        await refreshRecord(validArticle.slug);
        setMessage(result.warning ?? (action === 'publish' ? '文章已提交发布' : '文章已撤回'));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      setErrors(errorMap(error));
      setConflict(error instanceof ApiError && error.code === 'CONTENT_CONFLICT');
      setMessage(error instanceof Error ? error.message : '操作失败，请重试');
    } finally {
      setBusy('');
    }
  }

  async function reloadRemote() {
    if (!record?.article.slug) return;
    setBusy('draft');
    try {
      await refreshRecord(record.article.slug);
      setConflict(false);
      setMessage('已载入 GitHub 上的最新版本');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '刷新失败');
    } finally {
      setBusy('');
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/\.(?:md|markdown)$/iu.test(file.name)) {
      setMessage('请选择 .md 或 .markdown 文件');
      return;
    }
    if (file.size > 900_000) {
      setMessage('文件不能超过 900 KB');
      return;
    }
    try {
      const imported = importMarkdown(
        await file.text(),
        article.slug || slugFromFileName(file.name),
      );
      if (record) imported.slug = record.article.slug;
      setArticle(imported);
      setTagText(imported.tags.join('，'));
      setErrors({});
      setMessage(`已导入 ${file.name}，确认内容后再保存或发布`);
    } catch {
      setMessage('无法读取这个 Markdown 文件');
    }
  }

  function restoreRecovery() {
    if (!recovery) return;
    setArticle(recovery.article);
    setTagText(recovery.article.tags.join('，'));
    setRecovery(null);
    setMessage('已恢复这台设备上未保存的内容');
  }

  function ignoreRecovery() {
    clearRecovery(recoveryKey);
    setRecovery(null);
  }

  const showUnpublish = Boolean(versions.publishedSha) && status !== 'unpublished';

  return (
    <section
      className="editor-page"
      aria-label={record ? `编辑 ${record.article.title}` : '新建文章'}
    >
      <header className="editor-toolbar">
        <div className="editor-toolbar__identity">
          <button
            className="icon-button mobile-back"
            type="button"
            onClick={onBack}
            aria-label="返回文章列表"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className={`status-pill status-pill--${status}`}>{statusText[status]}</span>
            {dirty && <span className="dirty-label">未保存</span>}
          </div>
        </div>
        <div className="editor-actions">
          {showUnpublish && (
            <button
              className="button button--quiet"
              type="button"
              onClick={() => void runAction('unpublish')}
              disabled={Boolean(busy)}
            >
              撤回
            </button>
          )}
          <button
            className="button button--secondary"
            type="button"
            onClick={() => void runAction('draft')}
            disabled={Boolean(busy)}
          >
            {busy === 'draft' ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            保存草稿
          </button>
          <button
            className="button button--primary"
            type="button"
            onClick={() => void runAction('publish')}
            disabled={Boolean(busy)}
          >
            {busy === 'publish' ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <CloudUpload size={17} />
            )}
            发布
          </button>
        </div>
      </header>

      <div className="editor-scroll">
        {recovery && (
          <div className="notice notice--recovery" role="status">
            <div>
              <strong>发现这台设备上未保存的内容</strong>
              <span>{new Date(recovery.savedAt).toLocaleString('zh-CN')}</span>
            </div>
            <div className="notice__actions">
              <button type="button" onClick={restoreRecovery}>
                恢复
              </button>
              <button type="button" onClick={ignoreRecovery}>
                忽略
              </button>
            </div>
          </div>
        )}

        {(message || deployment) && (
          <div
            className={`notice ${conflict || deployment?.state === 'failure' ? 'notice--error' : ''}`}
            role="status"
          >
            <div>
              {deployment && <strong>{deployment.message}</strong>}
              {message && <span>{message}</span>}
            </div>
            <div className="notice__actions">
              {conflict && (
                <button type="button" onClick={() => void reloadRemote()}>
                  <RefreshCw size={15} /> 载入最新版
                </button>
              )}
              {deployment?.runUrl && (
                <a href={deployment.runUrl} target="_blank" rel="noreferrer">
                  部署详情 <ExternalLink size={14} />
                </a>
              )}
              {deployment?.state === 'success' &&
                publicationAction === 'publish' &&
                publication?.articleUrl && (
                  <a href={publication.articleUrl} target="_blank" rel="noreferrer">
                    查看文章 <ExternalLink size={14} />
                  </a>
                )}
            </div>
          </div>
        )}

        <div className="article-heading">
          <label className="title-field">
            <span className="visually-hidden">文章标题</span>
            <input
              data-field="title"
              value={article.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="文章标题"
              maxLength={100}
              aria-invalid={Boolean(errors.title)}
            />
          </label>
          {errors.title && <p className="field-error">{errors.title}</p>}
          <div className="article-heading__meta">
            <span>{stats.count.toLocaleString('zh-CN')} 字</span>
            <span>约 {stats.minutes} 分钟阅读</span>
            <button
              className="import-button"
              type="button"
              onClick={() => fileInput.current?.click()}
            >
              <FileUp size={16} /> 导入 Markdown
            </button>
            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              aria-label="选择 Markdown 文件"
              onChange={(event) => void importFile(event)}
            />
          </div>
        </div>

        <section className="metadata-panel" aria-label="文章信息">
          <div className="field field--wide">
            <label htmlFor="description">
              简介 <span>可选</span>
            </label>
            <textarea
              id="description"
              data-field="description"
              rows={2}
              value={article.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="用一两句话介绍这篇文章"
              maxLength={200}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>
          <div className="field">
            <label htmlFor="slug">文章地址</label>
            <div className="slug-field">
              <span>/posts/</span>
              <input
                id="slug"
                data-field="slug"
                value={article.slug}
                onChange={(event) => update('slug', event.target.value.toLowerCase())}
                placeholder="my-first-post"
                disabled={Boolean(record)}
                aria-invalid={Boolean(errors.slug)}
              />
            </div>
            {errors.slug && <p className="field-error">{errors.slug}</p>}
          </div>
          <div className="field">
            <label htmlFor="tags">标签</label>
            <input
              id="tags"
              data-field="tags"
              value={tagText}
              onChange={(event) => {
                const next = event.target.value;
                setTagText(next);
                update(
                  'tags',
                  next
                    .split(/[,，]/u)
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                );
              }}
              placeholder="Astro，TypeScript"
              aria-invalid={Boolean(errors.tags)}
            />
            {errors.tags && <p className="field-error">{errors.tags}</p>}
          </div>
          <div className="field">
            <label htmlFor="type">类型</label>
            <select
              id="type"
              data-field="type"
              value={article.type}
              onChange={(event) => update('type', event.target.value as ArticleInput['type'])}
            >
              <option value="note">学习笔记</option>
              <option value="article">技术文章</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="publishedAt">发布日期</label>
            <input
              id="publishedAt"
              data-field="publishedAt"
              type="date"
              value={article.publishedAt}
              onChange={(event) => update('publishedAt', event.target.value)}
              aria-invalid={Boolean(errors.publishedAt)}
            />
            {errors.publishedAt && <p className="field-error">{errors.publishedAt}</p>}
          </div>
          <div className="field">
            <label htmlFor="updatedAt">
              更新日期 <span>可选</span>
            </label>
            <input
              id="updatedAt"
              data-field="updatedAt"
              type="date"
              value={article.updatedAt}
              onChange={(event) => update('updatedAt', event.target.value)}
              aria-invalid={Boolean(errors.updatedAt)}
            />
            {errors.updatedAt && <p className="field-error">{errors.updatedAt}</p>}
          </div>
        </section>

        <section className="writing-section" aria-label="正文">
          <div className="writing-header">
            <div>
              <h2>正文</h2>
              {errors.body && <p className="field-error">{errors.body}</p>}
            </div>
            <div className="view-switcher" aria-label="编辑器显示方式">
              <button
                type="button"
                className={view === 'write' ? 'active' : ''}
                onClick={() => setView('write')}
              >
                编辑
              </button>
              <button
                type="button"
                className={view === 'preview' ? 'active' : ''}
                onClick={() => setView('preview')}
              >
                预览
              </button>
              <button
                type="button"
                className={`split-choice ${view === 'split' ? 'active' : ''}`}
                onClick={() => setView('split')}
              >
                双栏
              </button>
            </div>
          </div>
          <div className={`writing-workspace writing-workspace--${view}`}>
            {view !== 'preview' && (
              <div className="code-editor" data-field="body">
                <CodeMirror
                  value={article.body}
                  minHeight="480px"
                  extensions={editorExtensions}
                  onChange={(value) => update('body', value)}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: false,
                    highlightActiveLine: true,
                    highlightActiveLineGutter: false,
                  }}
                />
              </div>
            )}
            {view !== 'write' && (
              <div className="preview-pane">
                <MarkdownPreview markdown={article.body} />
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
