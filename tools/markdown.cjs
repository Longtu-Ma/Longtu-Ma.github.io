const MarkdownIt = require('markdown-it');
const texmath = require('markdown-it-texmath');
const katex = require('katex');
const { slugize, escapeHTML, highlight } = require('hexo-util');

function createMarkdown() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight: (code, language) => highlight(code, { lang: language, gutter: true, wrap: true })
  }).use(texmath, { engine: katex, delimiters: 'dollars', katexOptions: { throwOnError: true, strict: 'ignore', trust: false } });
  // Match Hexo's existing heading anchors and keep duplicate headings unique.
  md.core.ruler.push('heading_ids', state => {
    const used = new Map();
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      if (token.type !== 'heading_open') continue;
      const label = state.tokens[i + 1].content;
      const slug = slugize(label);
      const count = used.get(slug) || 0;
      used.set(slug, count + 1);
      token.attrSet('id', count ? `${slug}-${count}` : slug);
    }
  });
  const originalHeading = md.renderer.rules.heading_open;
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const open = originalHeading ? originalHeading(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
    const id = escapeHTML(tokens[idx].attrGet('id'));
    return `${open}<a href="#${id}" class="headerlink" aria-label="Link to section"></a>`;
  };
  return md;
}
module.exports = { createMarkdown };
