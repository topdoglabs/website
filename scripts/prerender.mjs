import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { getPageMetadata } from '../src/lib/page-metadata.js';

const apps = JSON.parse(await fs.readFile('public/apps.json', 'utf8'));
const site = JSON.parse(await fs.readFile('public/site.json', 'utf8'));
const template = await fs.readFile('dist/index.html', 'utf8');
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const metadata = (route) => {
  const meta = getPageMetadata(route, apps, site);
  return `<title>${escape(meta.title)}</title>
<meta name="description" content="${escape(meta.description)}">
<link rel="canonical" href="${escape(meta.canonical)}">
<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow'}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(meta.title)}">
<meta property="og:description" content="${escape(meta.description)}">
<meta property="og:url" content="${escape(meta.canonical)}">
<meta property="og:image" content="${escape(meta.image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(meta.title)}">
<meta name="twitter:description" content="${escape(meta.description)}">
<meta name="twitter:image" content="${escape(meta.image)}">`;
};
const withMeta = (html, route) => html.replace(/<title>.*?<\/title>/s, '').replace(/<meta\s+name="description"[^>]*>/s, '').replace('</head>', () => `${metadata(route)}\n</head>`);
process.env.NODE_ENV = 'production';
const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
const routes = ['/', '/apps', '/privacy', '/support-form', ...Object.keys(site.pages).map((slug) => `/${slug}`), ...apps.map((app) => `/apps/${app.slug}`), '/404'];
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.jsx');
  for (const route of routes) {
    const output = route === '/' ? 'dist/index.html' : route === '/404' ? 'dist/404.html' : `dist${route}/index.html`;
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, withMeta(template, route).replace('<div id="root"></div>', () => `<div id="root">${render(route)}</div>`));
  }
} finally { await server.close(); }
const support = await fs.readFile('dist/support.html', 'utf8');
const stylesheets = (template.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g) || []).join('\n');
if (!stylesheets) throw new Error('The support page needs the built site stylesheet.');
const options = [...site.support.subjectOptions, ...apps.map((app) => app.identity.name)].map((name) => `<option value="${escape(name)}">${escape(name)}</option>`).join('\n');
await fs.writeFile('dist/support.html', withMeta(support.replace('<link rel="stylesheet" href="/src/brand.css" />', stylesheets).replace(/(<select name="subject"[^>]*>)[\s\S]*?(<\/select>)/, (_match, open, close) => `${open}${options}${close}`), '/support'));
await fs.writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...routes.filter((route) => !['/404', '/support-form'].includes(route)), '/support'].map((route) => `<url><loc>${escape(site.seo.siteUrl + (route === '/' ? '' : route))}</loc></url>`).join('')}</urlset>`);
await fs.appendFile('dist/robots.txt', `\nSitemap: ${site.seo.siteUrl}/sitemap.xml\n`);
console.log(`Prerendered ${routes.length} pages, support catalog, and sitemap.`);
