import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const apps = JSON.parse(await fs.readFile('public/apps.json', 'utf8'));
const sources = [...new Set(apps.flatMap((app) => app.presentation.screenshots))];
let originalBytes = 0;
let optimizedBytes = 0;
for (const source of sources) {
  const input = path.join('public', source);
  originalBytes += (await fs.stat(input)).size;
  for (const width of [480, 960]) {
    const output = path.join('public/assets/optimized', source.replace(/^\/assets\//, '').replace(/\.[^.]+$/, `-${width}.webp`));
    await fs.mkdir(path.dirname(output), { recursive: true });
    await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(output);
    optimizedBytes += (await fs.stat(output)).size;
  }
}
console.log(`Prepared ${sources.length} screenshots: ${(originalBytes / 1e6).toFixed(2)} MB originals → ${(optimizedBytes / 1e6).toFixed(2)} MB across both responsive sizes.`);
