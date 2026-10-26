import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config';
import { extracto, noticias } from '../lib/contenido';

export async function GET(context: APIContext) {
  return rss({
    title: `Noticias de ${SITE.titulo}`,
    description: SITE.descripcion,
    site: context.site!,
    items: (await noticias()).slice(0, 50).map((n) => ({
      title: n.data.titulo,
      pubDate: n.data.fecha,
      description: extracto(n, 60),
      link: `/noticias/${n.id}/`,
    })),
  });
}
