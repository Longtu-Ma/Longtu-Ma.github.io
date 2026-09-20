// One-time, loss-aware recovery from the last published Git snapshot.
// Run only into an empty output directory: node tools/restore-from-published.cjs /tmp/recovered
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const cheerio = require('cheerio');
const Turndown = require('turndown');
const yaml = require('js-yaml');
const revision = 'e67b78b';
const output = process.argv[2];
if (!output || fs.existsSync(output)) throw new Error('Provide a new, empty output directory.');
const read = name => execFileSync('git', ['show', `${revision}:${name}`], { maxBuffer: 20 * 1024 * 1024 });
const write = (name, data) => {
  const dest = path.join(output, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, data);
};
const greek = { 'Δ': '\\Delta', 'ε': '\\varepsilon', 'κ': '\\kappa', 'λ': '\\lambda', 'μ': '\\mu', 'π': '\\pi', 'ρ': '\\rho', 'σ': '\\sigma', 'τ': '\\tau', 'ω': '\\omega', '∂': '\\partial', 'ℏ': '\\hbar', '±': '\\pm', '−': '-', '∑': '\\sum', '∫': '\\int', '∝': '\\propto', '∼': '\\sim', '≈': '\\approx', '≠': '\\ne', '≡': '\\equiv', '≤': '\\le', '≪': '\\ll', '≫': '\\gg', '′': '\\prime', '″': '\\prime\\prime' };
function glyph(code) {
  const original = String.fromCodePoint(parseInt(code, 16));
  if (code === '1D716') return '\\epsilon ';
  const normalized = original.normalize('NFKD');
  if (greek[original]) return greek[original] + ' ';
  if (greek[normalized]) return greek[normalized] + ' ';
  if (/^[a-zA-Z0-9()+,\/=;>]$/.test(normalized)) {
    const cp = original.codePointAt(0);
    return cp >= 0x1d468 && cp <= 0x1d49b ? `\\boldsymbol{${normalized}}` : normalized;
  }
  throw new Error(`Unmapped math glyph: ${code} ${original}`);
}
function tex(node) {
  if (node.type === 'text') return '';
  const attr = node.attribs || {};
  // Composite glyphs (e.g. double prime) contain paths that must not be counted again.
  if (attr['data-c']) return glyph(attr['data-c']);
  const children = (node.children || []).filter(c => c.type === 'tag' && c.name !== 'rect');
  const parts = children.map(tex);
  switch (attr['data-mml-node']) {
    case 'msub': return `${parts[0]}_{${parts[1]}}`;
    case 'msup': return `${parts[0]}^{${parts[1]}}`;
    case 'msubsup': {
      // MathJax SVG writes the superscript first; recover by vertical position.
      const offsets = children.slice(1).map(c => Number((c.attribs.transform || '').match(/translate\([^,]+,\s*([-\d.]+)/)?.[1]));
      if (offsets.length !== 2 || offsets.some(n => !Number.isFinite(n))) throw new Error('Unknown script positioning');
      return offsets[0] > offsets[1] ? `${parts[0]}_{${parts[2]}}^{${parts[1]}}` : `${parts[0]}_{${parts[1]}}^{${parts[2]}}`;
    }
    case 'munder': return `${parts[0]}_{${parts[1]}}`;
    case 'mfrac': return `\\frac{${parts[0]}}{${parts[1]}}`;
    case undefined: case 'math': case 'mi': case 'mn': case 'mo': case 'mrow': case 'TeXAtom': return parts.join('');
    default: throw new Error(`Unsupported math node: ${attr['data-mml-node']}`);
  }
}
function toMarkdown(html) {
  const $ = cheerio.load(html, { xml: false }, false);
  const formulas = [];
  const placeholder = (value, block) => {
    const token = `RECOVEREDMATHTOKEN${formulas.length}END`;
    formulas.push({ token, value: value.trim(), block });
    return block ? `<p>${token}</p>` : token;
  };
  const inlineMath = $('mjx-container').length;
  const displayMath = $('script[type^="math/tex"]').length;
  $('mjx-container').each((_, el) => $(el).replaceWith(placeholder(tex(el), false)));
  $('script[type^="math/tex"]').each((_, el) => $(el).replaceWith(placeholder($(el).text(), true)));
  $('script, a.headerlink').remove();
  // Protect the few unrendered original $...$ expressions from Markdown escaping.
  function protect(node) {
    if (node.type === 'text') node.data = node.data.replace(/(?<!\\)\$([^$]+)\$/g, (_, value) => placeholder(value, false));
    else for (const child of node.children || []) protect(child);
  }
  protect($.root()[0]);
  const td = new Turndown({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
  td.addRule('pdf', { filter: 'embed', replacement: (_, node) => `\n\n<embed src="${node.getAttribute('src')}" type="application/pdf" width="100%" height="720" title="文章 PDF">\n\n` });
  td.addRule('note', { filter: node => node.classList?.contains('note-large'), replacement: content => '\n\n' + content.trim().split('\n').map(line => '> ' + line).join('\n') + '\n\n' });
  let markdown = td.turndown($.html());
  for (const { token, value, block } of formulas) {
    markdown = block
      ? markdown.replace(new RegExp(`^([ >]*)${token}`, 'm'), (_, prefix) => `$$\n${value}\n$$`.split('\n').map(line => prefix + line).join('\n'))
      : markdown.replace(token, () => `$${value}$`);
  }
  return { markdown, inlineMath, displayMath, recoveredMath: formulas.length };
}
const entries = cheerio.load(read('search.xml').toString(), { xml: true });
const manifest = { sourceCommit: revision, posts: [], assets: [] };
entries('entry').each((_, entry) => {
  const e = entries(entry);
  const title = e.find('title').text();
  const url = decodeURI(e.find('url').text());
  const html = read(url.slice(1) + 'index.html').toString();
  const created = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//).slice(1).join('-');
  const articleDate = { 'Welcome to my first blog': ['2024-06-13 15:12:29', '2024-06-14 13:11:47'], 'Latex数学符号': ['2024-06-19 00:00:00', '2024-06-20 16:21:57'], '金属自由电子气体模型-1': ['2024-06-15 10:17:34', '2024-07-02 17:31:22'], '金属自由电子气体模型-2': ['2024-07-02 16:09:23', '2024-07-02 17:34:32'] }[title];
  if (!articleDate || !html.includes(articleDate[1])) throw new Error(`Cannot verify dates: ${title}`);
  const physics = title.includes('模型');
  const meta = { title, date: articleDate[0], updated: articleDate[1], permalink: url.slice(1), categories: physics ? ['固体物理'] : title.includes('Latex') ? ['LaTeX'] : [], tags: physics ? ['固体物理', '自由电子气体模型'] : title.includes('Latex') ? ['LaTeX'] : [], excerpt: title === 'Welcome to my first blog' ? 'Welcome! This is my first blog, for study notes and random thoughts.' : title === 'Latex数学符号' ? '在此处补档 Latex 的数学符号大全。' : title, math: physics };
  const { markdown, ...counts } = toMarkdown(e.find('content').text());
  const file = `source/_posts/${created}-${url.split('/').at(-2)}.md`;
  write(file, `---\n${yaml.dump(meta, { lineWidth: -1, quotingType: '"' })}---\n\n${markdown}\n`);
  manifest.posts.push({ title, url, file, ...counts });
});
const about = cheerio.load(read('about/index.html').toString());
const aboutBody = about('.markdown-body').first().html();
if (!aboutBody) throw new Error('Cannot locate About content');
write('source/about/index.md', `---\ntitle: About Me\ndate: 2024-06-13 00:00:00\nlayout: page\n---\n\n${toMarkdown(aboutBody).markdown.replace(/^# About Me\s+/, '')}\n`);
const files = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', revision]).toString().split('\0');
for (const file of files.filter(f => f.endsWith('.pdf') || f.startsWith('images/'))) {
  const destination = `source/${file}`;
  write(destination, read(file));
  manifest.assets.push(destination);
}
write('docs/restoration-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
