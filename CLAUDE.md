# Pixabots

Pixel character creator and avatar API. 9,856 unique combinations from 4 categories of 32x32 sprites.

## Roadmap

**Always check and update `ROADMAP.md` when starting or finishing work.** Move items between sections (Ideas → Up Next → Done) as they progress. Add new ideas as they come up.

## Monorepo structure

```
pixabots/
  app/              — Next.js app (creator UI + API routes)
  packages/core/    — @pixabots/core (ID system, parts catalog, random generation)
  art/png/          — source sprites (32x32 PNGs)
  marketing/        — grid images for marketing
  ROADMAP.md        — project roadmap (Ideas / Polish / Up Next / Done)
```

## Key conventions

- **Font**: Pixelify Sans (Google Fonts), all weights 400-700
- **Icons**: pixelarticons package — use the `PixelIcon` component (`src/components/ui/pixel-icon.tsx`), add new icons there by inlining SVG paths
- **Pixel art**: never antialiased — `imageSmoothingEnabled = false` on canvas, `image-rendering: pixelated` in CSS, Sharp `kernel: nearest`
- **Parts arrays are APPEND-ONLY** — never reorder or remove entries. This keeps existing IDs stable forever.
- **ID system**: 4-char base36 string, one char per category (eyes, heads, body, top). Deterministic, reversible, no database.

## Adding new parts

1. Add PNGs to `art/png/{category}/`
2. Copy to `app/public/parts/{category}/`
3. **Append** to the arrays in `packages/core/src/parts.ts` (never reorder!)
4. Rebuild `@pixabots/core`: `pnpm --filter @pixabots/core build`

## API

- `GET /api/pixabot/{id}` — PNG image. `?size=32|64|128|240|480|960`, `?format=json` for metadata, `?animated=true` for animated GIF
- `GET /api/pixabot/random` — 302 redirect to random pixabot (or `?format=json`)
- JSON responses include `png` and `gif` URLs
- CORS enabled, immutable caching on deterministic endpoints

## Deployment

- Vercel, root directory is `.` (project root)
- `vercel.json` handles pnpm monorepo build: builds @pixabots/core first, then the Next.js app
- `packageManager: pnpm@9.0.6` in root package.json
