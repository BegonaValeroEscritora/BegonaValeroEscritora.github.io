import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export const MAX_SIDE = 2400;

// Applies EXIF rotation, limits the long side to MAX_SIDE and drops all metadata (GPS included).
// Returns true if the file was rewritten.
export async function optimize(src, dest = src) {
  const img = sharp(src, { failOn: 'none' });
  const meta = await img.metadata();
  const big = Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_SIDE;
  const hasMeta = Boolean(meta.exif || meta.xmp || meta.iptc || (meta.orientation && meta.orientation !== 1));
  if (src === dest && !big && !hasMeta) return false;

  let pipeline = img.rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true });
  const ext = path.extname(dest).toLowerCase();
  if (ext === '.png') pipeline = pipeline.png({ compressionLevel: 9, palette: meta.channels === 4 ? false : true });
  else if (ext === '.webp') pipeline = pipeline.webp({ quality: 85 });
  else pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });

  const buf = await pipeline.toBuffer();
  // Never replace an already-small file with a bigger one just for re-encoding.
  if (src === dest && !big && buf.length >= fs.statSync(src).size && !hasMeta) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return true;
}
