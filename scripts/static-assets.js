const fs = require('node:fs');
const path = require('node:path');

hexo.extend.generator.register('math-assets', () => {
  const root = path.dirname(require.resolve('katex/package.json'));
  const names = ['katex.min.css', ...fs.readdirSync(path.join(root, 'dist/fonts')).map(name => `fonts/${name}`)];
  return names.map(name => ({ path: `vendor/katex/${name}`, data: () => fs.createReadStream(path.join(root, 'dist', name)) }));
});

// The old malformed combined tag remains reachable after the tags are corrected.
hexo.extend.generator.register('legacy-tag-redirect', () => [{
  path: 'tags/固体物理-自由电子气体模型/index.html',
  data: '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/tags/自由电子气体模型/"><link rel="canonical" href="https://longtu-ma.github.io/tags/自由电子气体模型/"><title>自由电子气体模型</title><a href="/tags/自由电子气体模型/">查看自由电子气体模型系列</a></html>'
}]);
