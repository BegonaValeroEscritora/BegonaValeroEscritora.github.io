import fs from 'node:fs';
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { hoyISO, iso } from './fechas';

export type Noticia = CollectionEntry<'noticias'>;
export type Evento = CollectionEntry<'agenda'>;
export type Libro = CollectionEntry<'libros'>;

export const TIPOS = {
  prensa: { etiqueta: 'Prensa', plural: 'Prensa', ruta: 'prensa' },
  presentacion: { etiqueta: 'Presentación', plural: 'Presentaciones', ruta: 'presentaciones' },
  premio: { etiqueta: 'Premio', plural: 'Premios', ruta: 'premios' },
} as const;

const porFechaDesc = (a: { data: { fecha: Date } }, b: { data: { fecha: Date } }) => b.data.fecha.valueOf() - a.data.fecha.valueOf();

export async function noticias() {
  return (await getCollection('noticias', (n) => !n.data.borrador)).sort(porFechaDesc);
}

export async function libros() {
  return (await getCollection('libros')).sort((a, b) => b.data.orden - a.data.orden);
}

export async function agenda() {
  const hoy = hoyISO();
  const todos = await getCollection('agenda');
  const proximos = todos.filter((e) => iso(e.data.fecha) >= hoy).sort((a, b) => -porFechaDesc(a, b));
  const pasados = todos.filter((e) => iso(e.data.fecha) < hoy).sort(porFechaDesc);
  return { proximos, pasados };
}

// Todas las imágenes de las carpetas de noticias; la galería de una noticia son las de su carpeta.
const imagenes = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/noticias/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}',
  { eager: true },
);

export interface Foto { archivo: string; img: ImageMetadata; }

// Ojo: leer `img.src` hace que Astro publique también el original sin optimizar, así que se compara por nombre de archivo.
export function fotosDe(id: string): Foto[] {
  const prefijo = `/src/content/noticias/${id}/`;
  return Object.keys(imagenes)
    .filter((k) => k.startsWith(prefijo))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((k) => ({ archivo: k.slice(prefijo.length), img: imagenes[k].default }));
}

const archivoPortada = (n: Noticia) => n.filePath && fs.readFileSync(n.filePath, 'utf8').match(/^portada:\s*["']?\.\/([^"'\n]+)/m)?.[1];

export function portadaDe(n: Noticia): Foto | undefined {
  const fotos = fotosDe(n.id);
  const nombre = archivoPortada(n);
  return fotos.find((f) => f.archivo === nombre) ?? fotos[0];
}

// Imagen para tarjetas y para compartir: la portada de la noticia o, si no tiene fotos, la cubierta de su libro.
export async function imagenDe(n: Noticia): Promise<{ img: ImageMetadata; deLibro: boolean } | undefined> {
  const foto = portadaDe(n);
  if (foto) return { img: foto.img, deLibro: false };
  for (const ref of n.data.libros) {
    const libro = await getEntry(ref);
    if (libro?.data.portada) return { img: libro.data.portada, deLibro: true };
  }
}

export const años = (lista: Noticia[]) => [...new Set(lista.map((n) => n.data.fecha.getUTCFullYear()))].sort((a, b) => b - a);

export const extracto = (n: Noticia, palabras = 40) => {
  if (n.data.subtitulo) return n.data.subtitulo;
  const texto = (n.body ?? '').replace(/<[^>]+>/g, ' ').replace(/[#*_>\[\]()]/g, '').replace(/\s+/g, ' ').trim();
  const w = texto.split(' ');
  return w.length > palabras ? w.slice(0, palabras).join(' ') + '…' : texto;
};
