const dialog = document.querySelector('[data-search-dialog]');
const input = dialog?.querySelector('input[type="search"]');
const statusElement = dialog?.querySelector('.search-status');
const results = dialog?.querySelector('.search-results');
const fallbackData = document.querySelector('[data-search-fallback]');
let pagefind;
let requestNumber = 0;

async function loadPagefind() {
  if (pagefind || !dialog) return pagefind;
  const moduleURL = dialog.dataset.pagefindUrl;
  if (!moduleURL) return undefined;
  pagefind = await import(moduleURL);
  await pagefind.options({ baseUrl: dialog.dataset.baseUrl || '/' });
  return pagefind;
}

function setStatus(message) {
  if (statusElement) statusElement.textContent = message;
}

function plainExcerpt(excerpt) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = excerpt;
  return wrapper.textContent?.trim() ?? '';
}

function showResults(items) {
  if (!results) return;
  results.replaceChildren();

  for (const item of items) {
    const row = document.createElement('li');
    const link = document.createElement('a');
    const title = document.createElement('strong');
    const excerpt = document.createElement('p');
    link.href = item.url;
    title.textContent = item.meta.title ?? '未命名文章';
    excerpt.textContent = plainExcerpt(item.excerpt);
    link.append(title, excerpt);
    row.append(link);
    results.append(row);
  }
}

function searchFallback(query) {
  if (!fallbackData?.textContent) return undefined;

  try {
    const normalized = query.normalize('NFKC').toLocaleLowerCase('zh-CN');
    return JSON.parse(fallbackData.textContent)
      .filter((item) =>
        item.searchText.normalize('NFKC').toLocaleLowerCase('zh-CN').includes(normalized),
      )
      .slice(0, 8)
      .map((item) => ({
        url: item.url,
        meta: { title: item.title },
        excerpt: item.excerpt,
      }));
  } catch (error) {
    console.error('[search] Development search data is invalid', error);
    return undefined;
  }
}

async function search(query) {
  const normalized = query.trim();
  const currentRequest = ++requestNumber;
  if (!normalized) {
    showResults([]);
    setStatus('输入关键词开始搜索');
    return;
  }

  setStatus('正在搜索…');
  try {
    const engine = await loadPagefind();
    if (!engine) throw new Error('Pagefind is unavailable');
    const response = await engine.search(normalized);
    const items = await Promise.all(response.results.slice(0, 8).map((result) => result.data()));
    if (currentRequest !== requestNumber) return;
    showResults(items);
    setStatus(items.length ? `找到 ${response.results.length} 篇相关文章` : '没有找到相关文章');
  } catch (error) {
    console.error('[search] Pagefind query failed', error);
    if (currentRequest !== requestNumber) return;

    const items = searchFallback(normalized);
    if (items) {
      showResults(items);
      setStatus(items.length ? `找到 ${items.length} 篇相关文章` : '没有找到相关文章');
    } else {
      setStatus('搜索暂时不可用，请刷新页面后重试');
    }
  }
}

document.querySelectorAll('[data-search-open]').forEach((button) => {
  button.addEventListener('click', () => {
    dialog?.showModal();
    window.setTimeout(() => input?.focus(), 0);
  });
});

input?.addEventListener('input', () => void search(input.value));
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
