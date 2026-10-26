// Crea el esqueleto de una noticia o de un evento de la agenda.
// Uso: npm run nueva -- noticia "Título de la noticia" [AAAA-MM-DD]
//      npm run nueva -- evento "Título del evento" AAAA-MM-DD
import fs from 'node:fs';
import path from 'node:path';

const [tipo, titulo, fecha = new Date().toLocaleDateString('en-CA')] = process.argv.slice(2);
if (!['noticia', 'evento'].includes(tipo) || !titulo || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
  console.error('Uso: npm run nueva -- noticia|evento "Título" [AAAA-MM-DD]');
  process.exit(1);
}
const slug = `${fecha}-${titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 8).join('-')}`;
const q = (s) => JSON.stringify(s);

let destino;
if (tipo === 'noticia') {
  destino = path.join('src/content/noticias', slug, 'index.md');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, `---
titulo: ${q(titulo)}
subtitulo: ""
fecha: ${fecha}
tipo: presentacion # prensa | presentacion | premio
libros: [] # p. ej. [la-venganza-de-los-templarios]
# portada: ./01.jpg   # opcional; por defecto, la primera foto de la carpeta
etiquetas: []
---

Texto de la noticia en Markdown. Las fotos de esta carpeta aparecen como galería al final.
`, { flag: 'wx' });
  console.log(`Creada ${destino}\nCopia las fotos en ${path.dirname(destino)}/ (se ordenan por nombre).`);
} else {
  destino = path.join('src/content/agenda', `${slug}.md`);
  fs.writeFileSync(destino, `---
titulo: ${q(titulo)}
fecha: ${fecha}
hora: "" # p. ej. "19:00 h"
lugar: "" # p. ej. "Librería de Campanar, Valencia"
libros: []
# enlace: https://...
---

Descripción del evento.
`, { flag: 'wx' });
  console.log(`Creado ${destino}`);
}
