# MJM 的技术博客

一个面向技术文章和学习笔记的纯静态博客。使用 Astro 与 Markdown，内置全文搜索、标签、RSS、站点地图、深色模式、代码复制、文章目录和 GitHub Pages 自动发布。

## 本地运行

需要 Node.js 22.12 或更高版本。

```bash
npm install
npm run dev
```

浏览器打开终端显示的地址即可。常用命令：

```bash
npm run dev        # 本地写作与实时预览
npm run build      # 生成静态网站和搜索索引
npm run preview    # 预览构建结果
npm run check:site # 检查必需产物、站内链接和标题锚点
npm run test:all   # 类型、单元测试、桌面和手机端浏览器测试
```

## 写一篇文章

1. 在 `src/content/posts/` 下新建英文短横线命名的目录，例如 `css-grid-notes/`。
2. 把 `templates/post.md` 复制成该目录里的 `index.md`。
3. 修改标题、简介、日期、标签和正文。
4. 完成后将 `draft: true` 改成 `draft: false`。

最终路径如下：

```text
src/content/posts/css-grid-notes/index.md
```

文章不需要封面图。`type` 使用 `article`（技术文章）或 `note`（学习笔记）。首页会按 `publishedAt` 从新到旧自动排列；未来日期和草稿只在本地预览，不会进入生产构建。标签页、相关文章、阅读时间、文章目录、RSS 和搜索索引也会自动生成。

## 修改个人信息

- 网站名称、作者和简介：`src/config/site.ts`
- 关于页：`src/pages/about.astro`
- 首页主标题：`src/pages/index.astro`
- 全局配色和排版：`src/styles/global.css`

如果希望页头显示 GitHub 图标，将 `.env.example` 复制为 `.env`，再填写自己的 GitHub 地址。

## 免费发布到 GitHub Pages

建议先创建一个名为 `blog` 的公开 GitHub 仓库，然后把当前项目推送到仓库的 `main` 分支。进入仓库的 **Settings → Pages**，将 **Source** 设为 **GitHub Actions**。

之后每次推送都会自动构建并发布，免费地址通常是：

```text
https://你的GitHub用户名.github.io/blog/
```

工作流会自动识别 GitHub 用户名和仓库名，不需要手改 `base`。如果仓库名本身是 `你的用户名.github.io`，也会自动发布在根路径。

## 换成自己的域名

购买并备案域名后，在 GitHub 仓库 **Settings → Secrets and variables → Actions → Variables** 中增加：

- `SITE_URL`：例如 `https://blog.example.com`
- `BASE_PATH`：填写 `/`

同时在 GitHub Pages 中绑定域名并按提示设置 DNS。将来迁移到阿里云 OSS 时，网站代码和文章不需要改，只需把 `dist/` 目录上传到 OSS 并调整自动部署工作流。

## 项目结构

```text
src/content/posts/  Markdown 文章
src/components/     页面组件
src/pages/          首页、文章、标签、关于、RSS 等路由
src/styles/         全局视觉样式
public/             图标和浏览器端搜索脚本
.github/workflows/  自动检查与发布
```
