// One-off migration from the Jekyll site (_posts, _agenda, images/) to Astro content collections.
// Usage: node scripts/migrate.mjs
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { optimize } from './lib/optimize.mjs';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'src/content');
const LEGACY_SITE = process.argv[2]; // optional: path to a Jekyll build, used to verify old URLs

const BOOKS = {
  lavenganzadelostemplarios: 'la-venganza-de-los-templarios',
  uncuentomagicosobrelasfallas: 'un-cuento-magico-sobre-las-fallas',
  untestigollamadocervantes: 'un-testigo-llamado-cervantes',
  lacasadelcompasdeoro: 'la-casa-del-compas-de-oro',
  eltrabajodeloslibros: 'el-trabajo-de-los-libros',
};
const BOOK_KEYWORDS = [
  [/templarios/i, 'la-venganza-de-los-templarios'],
  [/fallas/i, 'un-cuento-magico-sobre-las-fallas'],
  [/testigo llamado cervantes/i, 'un-testigo-llamado-cervantes'],
  [/comp[aá]s de oro/i, 'la-casa-del-compas-de-oro'],
  [/trabajo de los libros/i, 'el-trabajo-de-los-libros'],
];
const MEDIA = {
  '/images/esradio.mp3': '/media/esradio.mp3',
  '/images/rne.mp3': '/media/rne.mp3',
  '/images/posts/rpb.mp3': '/media/rpb.mp3',
  '/downloads/gaceta_plantin.pdf': '/media/gaceta-plantin.pdf',
  '/lacasadelcompasdeoro/articulo.pdf': '/media/articulo-casa-compas-de-oro.pdf',
  '/images/agenda.pdf': '/media/agenda-mesa-redonda.pdf',
};

const warnings = [];
const redirects = {};

function splitFrontMatter(raw) {
  raw = raw.replace(/\r\n?/g, '\n');
  const m = raw.match(/^﻿?---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return [{}, raw];
  let fm;
  try {
    fm = YAML.parse(m[1]) ?? {};
  } catch {
    fm = {};
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (!kv) continue;
      const v = kv[2].trim();
      fm[kv[1]] = /^\[.*\]$/.test(v) ? v.slice(1, -1).split(',').map((x) => x.trim()) : v;
    }
  }
  return [fm, m[2]];
}

const attrs = (s) => Object.fromEntries([...s.matchAll(/(\w+)\s*=\s*"([^"]*)"/g)].map((a) => [a[1], a[2]]));
const isNoPost = (a) => /true|yes/.test(a.nopost ?? '');
const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function cleanBody(body) {
  let b = body
    .replace(/<h2>\s*\{\{\s*page\.title\s*\}\}\s*<\/h2>/g, '')
    .replace(/\{\{\s*site\.(url|baseurl)\s*\}\}/g, '')
    .replace(/<div class="(clear|separator)"><\/div>/g, '')
    .replace(/<!--end-->/g, '')
    .replace(/<\/img>/g, '');
  for (const [from, to] of Object.entries(MEDIA)) b = b.split(from).join(to);
  // Markdown treats indented lines as code blocks, so flatten indentation of the legacy HTML.
  b = b.split('\n').map((l) => l.trimStart()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return b;
}

function extractImages(body) {
  const found = [];
  body = body.replace(/\{%\s*include\s+image\.html([^%]*)%\}/g, (_, a) => {
    const at = attrs(a);
    found.push((isNoPost(at) ? 'images/' : 'images/posts/') + at.source.trim());
    return '';
  });
  body = body.replace(/\{%\s*include\s+imagegallery\.html([^%]*)%\}/g, (_, a) => {
    const at = attrs(a);
    for (const s of at.images.split(',')) if (s.trim()) found.push((isNoPost(at) ? 'images/' : 'images/posts/') + s.trim());
    return '';
  });
  return [body, found];
}

function yamlDoc(obj) {
  const clean = Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length)));
  return `---\n${YAML.stringify(clean, { lineWidth: 0 })}---\n`;
}

async function copyImages(sources, dir) {
  const names = new Map();
  let n = 0;
  for (const src of sources) {
    if (names.has(src)) continue;
    let abs = path.join(ROOT, src);
    // Some legacy posts had typos in image paths; recover them when the file name is unique.
    if (!fs.existsSync(abs)) {
      const hits = fs.globSync(`images/**/${path.basename(src)}`, { cwd: ROOT }).filter((p) => !p.includes('/thumbs/'));
      if (hits.length === 1) abs = path.join(ROOT, hits[0]);
    }
    if (!fs.existsSync(abs)) { warnings.push(`missing image ${src} (${path.basename(dir)})`); continue; }
    let ext = path.extname(src).toLowerCase().replace('.jpeg', '.jpg');
    const name = `${String(++n).padStart(2, '0')}${ext}`;
    await optimize(abs, path.join(dir, name));
    names.set(src, name);
  }
  return names;
}

async function migratePosts() {
  const files = fs.readdirSync(path.join(ROOT, '_posts')).filter((f) => /^\d{4}-.*\.html$/.test(f));
  for (const file of files) {
    const [fm, raw] = splitFrontMatter(fs.readFileSync(path.join(ROOT, '_posts', file), 'utf8'));
    const m = file.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(.*)\.html$/);
    const [y, mo, d, rest] = [m[1], m[2].padStart(2, '0'), m[3].padStart(2, '0'), m[4]];
    const slug = `${y}-${mo}-${d}-${slugify(rest)}`;
    const dir = path.join(OUT, 'noticias', slug);
    fs.mkdirSync(dir, { recursive: true });

    let [body, imgs] = extractImages(raw);
    const cover = fm.image ? 'images/posts/' + String(fm.image).trim() : undefined;
    if (cover && !imgs.includes(cover)) imgs.unshift(cover);
    const names = await copyImages(imgs, dir);

    body = cleanBody(body);
    let subtitulo;
    const h2 = body.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (h2) {
      subtitulo = h2[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      body = body.slice(h2[0].length).trim();
    }

    const cats = [].concat(fm.categories ?? []).map(String);
    const tipo = cats.includes('premios') ? 'premio' : cats.includes('presentaciones') ? 'presentacion' : 'prensa';
    const libros = cats.map((c) => BOOKS[c]).filter(Boolean);
    const tags = typeof fm.tags === 'string' ? fm.tags.split(',') : [].concat(fm.tags ?? []);

    const data = {
      titulo: String(fm.title).trim(),
      subtitulo,
      fecha: `${y}-${mo}-${d}`,
      tipo,
      libros,
      portada: cover && names.has(cover) ? `./${names.get(cover)}` : undefined,
      etiquetas: tags.map((t) => String(t).trim()).filter(Boolean),
    };
    fs.writeFileSync(path.join(dir, 'index.md'), yamlDoc(data) + '\n' + body + '\n');

    const oldUrl = `/${cats.join('/')}/${y}/${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}/${rest}/`;
    if (LEGACY_SITE && !fs.existsSync(path.join(LEGACY_SITE, decodeURI(oldUrl), 'index.html'))) {
      warnings.push(`old URL not found in legacy build: ${oldUrl}`);
    } else {
      redirects[encodeURI(oldUrl)] = `/noticias/${slug}/`;
    }
  }
  return files.length;
}

function parseDmy(s) {
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return undefined;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

async function migrateAgenda() {
  const files = fs.readdirSync(path.join(ROOT, '_agenda')).filter((f) => f.endsWith('.html') && !f.startsWith('_') && !f.includes(' copy'));
  const dir = path.join(OUT, 'agenda');
  fs.mkdirSync(dir, { recursive: true });
  for (const file of files) {
    const [fm, raw] = splitFrontMatter(fs.readFileSync(path.join(ROOT, '_agenda', file), 'utf8'));
    const fecha = fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : parseDmy(fm.date);
    if (!fecha) { warnings.push(`agenda without parseable date: ${file} (${fm.date})`); continue; }
    let [body, imgs] = extractImages(raw);
    body = cleanBody(body);
    const text = `${fm.title} ${body}`;
    const libros = [...new Set(BOOK_KEYWORDS.filter(([re]) => re.test(text)).map(([, b]) => b))];
    const slug = slugify(path.basename(file, '.html'));
    let imagen;
    if (imgs.length) {
      const imgDir = path.join(dir, slug);
      fs.mkdirSync(imgDir, { recursive: true });
      const names = await copyImages(imgs, imgDir);
      if (names.size) imagen = `./${slug}/${[...names.values()][0]}`;
    }
    const data = { titulo: String(fm.title).trim(), fecha, libros, imagen };
    fs.writeFileSync(path.join(dir, `${slug}.md`), yamlDoc(data) + '\n' + body + '\n');
    const old = '/agenda/' + path.basename(file, '.html');
    if (old !== `/agenda/${slug}`) redirects[encodeURI(old)] = `/agenda/${slug}/`;
  }
  return files.length;
}

// Images used by hand-written pages (books, author page).
const ASSETS = {
  'libros/la-venganza-de-los-templarios/portada.jpg': 'images/portada_venganza.jpg',
  'libros/un-cuento-magico-sobre-las-fallas/portada.jpg': 'images/posts/fallas.jpg',
  'libros/un-cuento-magico-sobre-las-fallas/3d.jpg': 'images/posts/fallas3d.jpg',
  'libros/un-testigo-llamado-cervantes/portada.jpg': 'images/testigo.jpg',
  'libros/un-testigo-llamado-cervantes/3d.jpg': 'images/testigo3d2.jpg',
  'libros/historias-de-la-historia/portada.jpg': 'images/posts/2024/historias.jpg',
  'libros/la-casa-del-compas-de-oro/portada.jpg': 'images/casa_compas_portada.jpg',
  'libros/el-trabajo-de-los-libros/portada.jpg': 'images/book1.jpg',
  'libros/el-trabajo-de-los-libros/ilustracion-portada.jpg': 'images/banner.jpg',
};
const AUTHOR_ASSETS = {
  'retrato.jpg': 'images/BegonaValero4b.jpg',
  'retrato-2.jpg': 'images/BegonaValero.jpg',
  'retrato-3.jpg': 'images/BegonaValero1.jpg',
  'retrato-4.jpg': 'images/BegonaValero2.jpg',
  'retrato-5.jpg': 'images/BegonaValero3.jpg',
  'senadora.jpg': 'images/posts/senadora/5.jpg',
  'red-escritoras.jpg': 'images/red_escritoras.jpg',
  'grupo-novela-historica.jpg': 'images/posts/2020/grupo.jpg',
  'escritores-con-la-historia.png': 'images/escritores historia.png',
  'premio-odilo.png': 'images/ODILO.png',
};

async function migrateAssets() {
  for (const [to, from] of Object.entries(ASSETS)) await optimize(path.join(ROOT, from), path.join(OUT, to));
  for (const [to, from] of Object.entries(AUTHOR_ASSETS)) await optimize(path.join(ROOT, from), path.join(ROOT, 'src/assets/autora', to));
  const pub = path.join(ROOT, 'public/media');
  fs.mkdirSync(pub, { recursive: true });
  for (const [from, to] of Object.entries(MEDIA)) fs.copyFileSync(path.join(ROOT, from), path.join(ROOT, 'public', to));
}

Object.assign(redirects, {
  '/lavenganzadelostemplarios/novela': '/libros/la-venganza-de-los-templarios/',
  '/uncuentomagicosobrelasfallas/novela': '/libros/un-cuento-magico-sobre-las-fallas/',
  '/untestigollamadocervantes/novela': '/libros/un-testigo-llamado-cervantes/',
  '/lacasadelcompasdeoro/novela': '/libros/la-casa-del-compas-de-oro/',
  '/eltrabajodeloslibros/novela': '/libros/el-trabajo-de-los-libros/',
  '/otra-obra/eltontodelbote': '/libros/el-tonto-del-bote/',
  '/medios-comunicacion': '/noticias/prensa/',
  '/presentaciones-libro': '/noticias/presentaciones/',
  '/premios': '/noticias/premios/',
});

const posts = await migratePosts();
const events = await migrateAgenda();
await migrateAssets();
fs.writeFileSync(path.join(ROOT, 'src/redirects.json'), JSON.stringify(redirects, null, 2) + '\n');
console.log(`${posts} noticias, ${events} eventos, ${Object.keys(redirects).length} redirecciones`);
if (warnings.length) console.log('Avisos:\n  ' + warnings.join('\n  '));
