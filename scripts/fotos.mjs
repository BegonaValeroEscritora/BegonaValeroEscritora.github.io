// Reduce las fotos a 2400 px como máximo y elimina los metadatos (GPS incluido).
// Uso: npm run fotos            → revisa todas las imágenes de src/
//      node scripts/fotos.mjs --staged  → solo las añadidas al commit (lo usa el hook de pre-commit)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { optimize } from './lib/optimize.mjs';

const IMG = /\.(jpe?g|png|webp)$/i;
const staged = process.argv.includes('--staged');

const files = staged
  ? execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=AM', '-z'], { encoding: 'utf8' }).split('\0').filter((f) => f.startsWith('src/'))
  : fs.globSync('src/**/*', { withFileTypes: false });

const heic = files.filter((f) => /\.hei[cf]$/i.test(f));
if (heic.length) {
  console.error(`Fotos HEIC no admitidas (expórtalas como JPG):\n  ${heic.join('\n  ')}`);
  process.exit(1);
}

let n = 0;
for (const f of files.filter((f) => IMG.test(f) && fs.existsSync(f))) {
  const before = fs.statSync(f).size;
  if (await optimize(f)) {
    n++;
    console.log(`  ${f}: ${(before / 1e6).toFixed(1)} MB → ${(fs.statSync(f).size / 1e6).toFixed(1)} MB`);
    if (staged) execFileSync('git', ['add', '--', f]);
  }
}
console.log(n ? `${n} foto(s) optimizada(s).` : 'Fotos ya optimizadas.');
