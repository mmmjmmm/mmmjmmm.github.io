---
title: 如何在这个博客发布一篇文章
description: 从新建 Markdown 文件、填写文章信息，到提交并触发自动发布的完整写作流程。
publishedAt: 2026-08-07
type: note
tags:
  - 使用指南
  - Markdown
  - 博客
  - test
draft: false
---

这个网站不需要后台。每篇文章都是电脑上的一个 Markdown 文件，提交到 GitHub 后会自动构建并发布。

## 新建文章目录

在 `src/content/posts` 下新建一个英文短横线命名的目录，再创建 `index.md`：

```text
src/content/posts/my-first-note/index.md
```

## 填写文章信息

文件最上方是一小段文章信息：

```yaml
---
title: 我的第一篇学习笔记
description: 用一句话说明这篇文章解决了什么问题。
publishedAt: 2026-08-08
type: note
tags:
  - 学习笔记
  - JavaScript
draft: false
---
```

下面直接写正文即可。运行 `npm run dev`，浏览器会实时看到修改结果。

## 发布

确认内容后提交并推送到 GitHub。仓库自带的 GitHub Actions 会检查网站并发布静态文件，不需要手动上传服务器。
