import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const apps = JSON.parse(await fs.readFile('public/apps.json', 'utf8'));
test('production app pages include content and unique metadata without JavaScript', async () => {
  for (const app of apps) {
    const file = `dist/apps/${app.slug}/index.html`;
    assert.ok(await fs.access(file).then(() => true, () => false), `missing prerender: ${app.slug}`);
    const html = await fs.readFile(file, 'utf8');
    assert.ok(html.includes(`<title>${app.identity.name} | TopDog Labs</title>`));
    assert.match(html, /<h1[^>]*>/);
    assert.ok(html.includes(`https://topdoglabs.com/apps/${app.slug}`));
    assert.match(html, /property="og:image"/);
  }
});
test('static support choices match the entire app catalog', async () => {
  const html = await fs.readFile('dist/support.html', 'utf8');
  for (const app of apps) assert.ok(html.includes(`<option value="${app.identity.name}">`), app.slug);
});
test('missing pages have a dedicated page and no catch-all homepage rewrite', async () => {
  const config = JSON.parse(await fs.readFile('vercel.json', 'utf8'));
  assert.ok(!config.rewrites.some((rule) => rule.source === '/(.*)'));
  const html = await fs.readFile('dist/404.html', 'utf8');
  assert.match(html, /Page not found/);
  assert.match(html, /noindex/);
});
test('catalog images exist and optimized screenshots are smaller', async () => {
  for (const app of apps) {
    await fs.access(`public${app.presentation.icon}`);
    for (const source of app.presentation.screenshots) {
      const original = await fs.stat(`public${source}`);
      const optimized = source.replace('/assets/', '/assets/optimized/').replace(/\.[^.]+$/, '-960.webp');
      const result = await fs.stat(`dist${optimized}`);
      assert.ok(result.size < original.size, source);
    }
  }
});

test('privacy content contains a working contact and no unfinished template fields', async () => {
  const html = await fs.readFile('dist/privacy/index.html', 'utf8');
  assert.ok(!html.includes('__________'));
  assert.ok(html.includes('mailto:info@topdoglabs.com'));
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
});
