import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Libros y noticias viven en carpetas (index.md + imágenes); el id es el nombre de la carpeta.
const carpeta = ({ entry }: { entry: string }) => entry.split('/')[0];

const libros = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/libros', generateId: carpeta }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      genero: z.string(),
      editorial: z.string().optional(),
      año: z.number().optional(),
      orden: z.number().default(0),
      destacado: z.boolean().default(false),
      agotado: z.boolean().default(false),
      otraObra: z.boolean().default(false),
      portada: image().optional(),
      resumen: z.string(),
      premios_texto: z.string().optional(),
      citas: z.array(z.object({ texto: z.string(), autor: z.string().optional(), cargo: z.string().optional() })).default([]),
      ficha: z.record(z.string(), z.coerce.string()).default({}),
      compra: z.array(z.object({ texto: z.string(), url: z.url() })).default([]),
    }),
});

const noticias = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/noticias', generateId: carpeta }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      subtitulo: z.string().optional(),
      fecha: z.coerce.date(),
      tipo: z.enum(['prensa', 'presentacion', 'premio']),
      libros: z.array(reference('libros')).default([]),
      portada: image().optional(),
      etiquetas: z.array(z.string()).default([]),
      borrador: z.boolean().default(false),
    }),
});

const agenda = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/agenda' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      fecha: z.coerce.date(),
      hora: z.string().optional(),
      lugar: z.string().optional(),
      libros: z.array(reference('libros')).default([]),
      imagen: image().optional(),
      enlace: z.url().optional(),
    }),
});

const premios = defineCollection({
  loader: file('./src/content/premios.yaml'),
  schema: z.object({
    nombre: z.string(),
    año: z.number(),
    detalle: z.string(),
    libro: reference('libros'),
    noticia: reference('noticias'),
  }),
});

export const collections = { libros, noticias, agenda, premios };
