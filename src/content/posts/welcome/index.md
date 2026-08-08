---
title: 欢迎来到我的技术博客
description: 这是这个博客的第一篇文章，也是一份关于内容方向、写作方式和网站能力的简短说明。
publishedAt: 2026-08-08
type: article
tags:
  - 博客
  - Astro
draft: false
---

这里会记录我在开发和学习过程中的思考：做成了什么、为什么这么做，以及那些真正值得记住的坑。

## 为什么写博客

知识只有经过整理，才更容易变成可以重复使用的经验。这个博客不会追求更新频率，而会尽量把每一件事说明白。

我主要会写这些内容：

- 技术实践与方案取舍
- 学习过程中形成的笔记
- 问题排查和踩坑记录
- 偶尔出现的工具与效率话题

## 文章是什么样的

文章使用 Markdown 编写。标题、列表、链接和代码块都保持简单，让注意力回到内容本身。

```ts
type Note = {
  title: string;
  learnedAt: Date;
};

const writeItDown = (note: Note) => {
  return `${note.title} · ${note.learnedAt.toLocaleDateString('zh-CN')}`;
};
```

## 接下来

下一篇文章，就从最近真正解决过的一个问题开始。
