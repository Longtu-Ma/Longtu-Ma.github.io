const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const root = path.resolve('public');
if (!fs.existsSync(root)) throw new Error('public/ is missing; run npm run build first');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const $ = cheerio.load(html);
const titles = $('.home-article-title').map((_, n) => $(n).text().trim()).get();
if (titles.length !== 1) throw new Error(`Expected 1 post on home page, found ${titles.length}`);
for (const required of ['index.html', 'archives/index.html', 'about/index.html', 'search.xml']) {
  if (!fs.existsSync(path.join(root, required))) throw new Error(`Missing generated file: ${required}`);
}
const posts = [...html.matchAll(/href="(\/2024\/[^\"]+?)"/g)].map(m => m[1]).filter((x, i, a) => a.indexOf(x) === i);
if (posts.length !== 1) throw new Error(`Expected 1 post route, found ${posts.length}`);
console.log(`OK: ${titles.length} posts, ${posts.length} routes`);
