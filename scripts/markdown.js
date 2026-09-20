// Render formulas at build time: no browser MathJax/CDN dependency.
const { createMarkdown } = require('../tools/markdown.cjs');
const markdown = createMarkdown();
for (const extension of ['md', 'markdown', 'mkd', 'mkdn', 'mdwn', 'mdtxt', 'mdtext']) {
  hexo.extend.renderer.register(extension, 'html', data => markdown.render(data.text), true);
}
