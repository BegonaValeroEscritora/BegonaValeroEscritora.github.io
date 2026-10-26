# Web de Begoña Valero

Static Astro site deployed to GitHub Pages (www.begonavalero.com) by `.github/workflows/deploy.yml` on every push to `master` and once a day (so the agenda and "Hoy" labels stay current). Content and UI text are in Spanish.

## Commands

- `npm install` once (also enables the pre-commit hook that shrinks photos).
- `npm run dev` for a local preview at http://localhost:4321 (search only works after `npm run build && npm run preview`).
- `npm run nueva -- noticia "Título" [AAAA-MM-DD]` / `npm run nueva -- evento "Título" AAAA-MM-DD` scaffold content.
- `npm run fotos` shrinks images in `src/` to ≤2400px and strips EXIF/GPS. Runs automatically on commit.
- `npm run build` must pass before pushing: the content schemas in `src/content.config.ts` validate every file.

## Content (src/content)

- **Noticias**: `noticias/<AAAA-MM-DD-slug>/index.md` plus its photos in the same folder. Every image in the folder becomes the gallery, sorted by file name; the cover is `portada:` or else the first photo. Front matter: `titulo`, `subtitulo` (one-sentence summary), `fecha`, `tipo` (`prensa` | `presentacion` | `premio`), `libros` (ids from `libros/`), `etiquetas`. Body is Markdown; raw HTML is allowed for embeds (YouTube, iVoox, audio).
- **Agenda**: `agenda/<AAAA-MM-DD-slug>.md` with `titulo`, `fecha`, optional `hora`, `lugar`, `libros`, `enlace`, `imagen`. Past/upcoming is decided from the date; nothing to move by hand.
- **Libros**: `libros/<id>/index.md` with the cover image next to it. `destacado: true` puts a book in the home hero (only one). `orden` sorts the shelf (higher first). Body = synopsis.
- **Premios**: `premios.yaml`, shown on the home page; each links to a news post whose cover is used as the image.
- Book ids: `la-venganza-de-los-templarios`, `un-cuento-magico-sobre-las-fallas`, `un-testigo-llamado-cervantes`, `historias-de-la-historia`, `la-casa-del-compas-de-oro`, `el-trabajo-de-los-libros`, `el-tonto-del-bote`.

## Share previews (Facebook, WhatsApp…)

Every page sets its own `og:image` automatically: a news post uses its `portada` (or its first photo), falling back to the cover of its first book, then to the author portrait. So when adding a post, make sure the best photo is `01.jpg` or set `portada:` explicitly. Facebook caches previews: after changing an image, re-scrape the URL at https://developers.facebook.com/tools/debug/.

## Writing a news post from a press clipping or notes

1. `npm run nueva -- noticia "<title>" <date>`, then copy the photos into the new folder (rename to `01.jpg`, `02.jpg`… if order matters).
2. Write the title in the house style ("Begoña Valero participa en…"), a one-sentence `subtitulo`, 2–4 short paragraphs, and link the original article if there is one. Don't invent quotes, names or numbers that aren't in the source.
3. Set `tipo` and `libros`, run `npm run build`, commit and push.

## Other

- Site settings (email, Formspree form, GoatCounter analytics code, footer credit) live in `src/config.ts`.
- Old Jekyll URLs are redirected via `src/redirects.json`.
- Large media (MP3/PDF) go in `public/media/` and are linked as `/media/<file>`.
