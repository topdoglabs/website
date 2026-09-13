import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { mergeSiteContent } from '../src/lib/site-content.js';
import { getPageMetadata } from '../src/lib/page-metadata.js';
const fallback = JSON.parse(await fs.readFile('public/site.json', 'utf8'));

test('partial and malformed content retains navigation, labels, and metadata', () => {
  for (const supplied of [null, {}, { seo: null, home: { heroTitle: 'New title' } }, { navigation: { headerLinks: [null] }, footerColumns: [{ title: 'Broken', links: null }] }]) {
    const result = mergeSiteContent(fallback, supplied);
    assert.equal(result.seo.siteUrl, 'https://topdoglabs.com');
    assert.ok(result.home.heroPrimaryCta);
    assert.ok(result.navigation.headerLinks[0].href);
    assert.doesNotThrow(() => getPageMetadata('/', [], result));
  }
  assert.equal(mergeSiteContent(fallback, { home: { heroTitle: 'New title' } }).home.heroTitle, 'New title');
});
