# Longtu Ma's Blog

这是一个基于 Hexo 的个人博客项目，使用：

- Hexo 7.2.0
- Redefine 2.6.3
- KaTeX 0.16.22
- Node.js 22
- GitHub Pages + GitHub Actions


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

欢迎访问我的blog网站： https://longtu-ma.github.io/
