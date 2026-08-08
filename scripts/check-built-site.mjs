import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve(process.argv[2] ?? 'dist');
const requiredFiles = [
  'index.html',
  '404.html',
  'rss.xml',
  'robots.txt',
  'sitemap-index.xml',
  'pagefind/pagefind.js',
];

async function walk(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path.join(directory, entry.name), relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

function pageRoute(relativePath) {
  if (relativePath === 'index.html') return '/';
  if (relativePath.endsWith('/index.html'))
    return `/${relativePath.slice(0, -'index.html'.length)}`;
  return `/${relativePath}`;
}

function targetFile(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }

  const cleanPath = path.posix.normalize(decodedPath).replace(/^\/+/, '');
  if (!cleanPath || cleanPath === '.') return 'index.html';
  if (decodedPath.endsWith('/')) return path.posix.join(cleanPath, 'index.html');
  if (path.posix.extname(cleanPath)) return cleanPath;
  return path.posix.join(cleanPath, 'index.html');
}

function hasAnchor(html, fragment) {
  if (!fragment) return true;
  let decodedFragment;
  try {
    decodedFragment = decodeURIComponent(fragment);
  } catch {
    return false;
  }
  const ids = new Set(
    [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1].replaceAll('&amp;', '&')),
  );
  return ids.has(decodedFragment);
}

async function main() {
  await access(outputDirectory);
  const files = await walk(outputDirectory);
  const fileSet = new Set(files);
  const problems = [];

  for (const requiredFile of requiredFiles) {
    if (!fileSet.has(requiredFile)) problems.push(`缺少构建产物：${requiredFile}`);
  }

  const homeHTML = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
  const configuredBase = homeHTML.match(/\bdata-base-url=["']([^"']+)["']/)?.[1] ?? '/';
  const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
  const htmlCache = new Map();

  for (const relativePath of files.filter((file) => file.endsWith('.html'))) {
    const html = await readFile(path.join(outputDirectory, relativePath), 'utf8');
    htmlCache.set(relativePath, html);
    const sourceURL = new URL(
      `${base.replace(/^\/+/, '')}${pageRoute(relativePath).replace(/^\/+/, '')}`,
      'https://site.invalid/',
    );

    for (const match of html.matchAll(/\b(?:href|src)=["']([^"'<>]+)["']/g)) {
      const rawReference = match[1].replaceAll('&amp;', '&').trim();
      if (
        !rawReference ||
        rawReference.startsWith('//') ||
        /^[a-z][a-z\d+.-]*:/i.test(rawReference)
      ) {
        continue;
      }

      if (base !== '/' && rawReference.startsWith('/') && !rawReference.startsWith(base)) {
        problems.push(`${relativePath} 的链接越过部署基础路径：${rawReference}`);
        continue;
      }

      const resolved = new URL(rawReference, sourceURL);
      let pathname = resolved.pathname;
      if (base !== '/' && pathname.startsWith(base)) pathname = `/${pathname.slice(base.length)}`;
      const target = targetFile(pathname);
      if (!target || !fileSet.has(target)) {
        problems.push(`${relativePath} 包含无效内部链接：${rawReference}`);
        continue;
      }

      if (resolved.hash && target.endsWith('.html')) {
        const targetHTML =
          htmlCache.get(target) ?? (await readFile(path.join(outputDirectory, target), 'utf8'));
        htmlCache.set(target, targetHTML);
        if (!hasAnchor(targetHTML, resolved.hash.slice(1))) {
          problems.push(`${relativePath} 包含不存在的标题锚点：${rawReference}`);
        }
      }
    }
  }

  if (problems.length > 0) {
    console.error(`构建产物检查失败（${problems.length} 项）：`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `构建产物检查通过：${files.filter((file) => file.endsWith('.html')).length} 个 HTML 页面，内部链接均有效。`,
  );
}

main().catch((error) => {
  console.error('无法检查构建产物：', error);
  process.exitCode = 1;
});
