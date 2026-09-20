# Longtu Ma's Blog

这是基于 2024 年已发布静态站点恢复的 Hexo 博客项目，使用 Hexo 7、Redefine 2.6.3 和 KaTeX。文章原稿位于 `source/_posts/`，页面、图片与 PDF 也都在 `source/` 中维护。

## 写作

```bash
npm install
npm run new -- "文章标题"
npm run dev
```

新文章默认使用 `scaffolds/post.md`，Front Matter 中的 `categories`、`tags` 和 `math` 可以按需修改。公式使用 `$...$` 表示行内公式，使用 `$$...$$` 表示独立公式。已有文章中的 PDF 链接使用文章同目录的相对路径。

## 构建与检查

```bash
npm test
```

生成结果位于 `public/`，该目录已加入 `.gitignore`。`npm test` 会清理并重新生成网站，然后确认首页包含 4 篇文章、文章路由存在且公式样式已生成。

## 发布

仓库新增了 `.github/workflows/pages.yml`。在 GitHub 仓库 Settings → Pages → Build and deployment 中选择 **GitHub Actions**，之后推送 `main` 分支会自动构建并部署 `public/`。

当前仓库还保留了原来的静态发布文件，作为恢复前的历史快照；新的发布流程使用 Hexo 从 `source/` 重新生成页面。

## 恢复记录

`docs/restoration-manifest.json` 记录了恢复所依据的 Git 提交、文章映射、附件和公式数量。`tools/restore-from-published.cjs` 是一次性恢复工具，默认要求输出目录不存在，以避免覆盖现有内容。
