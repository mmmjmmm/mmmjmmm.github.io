import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useMemo } from 'react';

interface MarkdownPreviewProps {
  markdown: string;
}

marked.use({
  gfm: true,
  breaks: false,
});

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const html = useMemo(() => {
    const rendered = marked.parse(markdown, { async: false }) as string;
    return DOMPurify.sanitize(rendered, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel'],
    });
  }, [markdown]);

  if (!markdown.trim()) {
    return <div className="preview-empty">开始写正文后，这里会显示预览。</div>;
  }

  return <article className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />;
}
