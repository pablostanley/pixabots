# Pixabots

Pixel character creator and avatar API. 9,856 unique combinations from 4 categories of 32x32 sprites.

## Checklists

**After every change, check if any of these need updating:**

- `ROADMAP.md` — move items between sections, add new ideas
- `app/content/docs/` — update docs if API params, SDK functions, or parts changed
- `app/public/openapi.json` — update if API endpoints or params changed
- `@pixabots/core` on npm — bump version + republish if `packages/core/` changed
- `app/AGENTS.md` — update if conventions changed

## Monorepo structure

```
pixabots/
  app/              — Next.js app (creator UI + API routes)
  packages/core/    — @pixabots/core (published to npm as v0.1.0)
  art/png/          — source sprites (32x32 PNGs)
  marketing/        — grid images for marketing
  ROADMAP.md        — project roadmap (Ideas / Polish / Up Next / Done)
```

## Key conventions

- **Font**: Pixelify Sans (Google Fonts via `next/font/google`), all weights 400-700
- **Icons**: pixelarticons SVGs inlined in `PixelIcon` component (`app/src/components/ui/pixel-icon.tsx`). Add new icons by copying SVG path data into that file. Do NOT use @phosphor-icons/react (removed).
- **Pixel art**: never antialiased — `imageSmoothingEnabled = false` on canvas, `image-rendering: pixelated` in CSS, Sharp `kernel: nearest`
- **Parts arrays are APPEND-ONLY** — never reorder or remove entries. This keeps existing IDs stable forever.
- **ID system**: 4-char base36 string, one char per category (eyes, heads, body, top). Deterministic, reversible, no database.
- **Animation**: 8-frame bounce at 72ms/frame. Data lives in `packages/core/src/animation.ts` — always import from there, never duplicate.
- **Shared API helpers**: CORS headers, OPTIONS handler, imageResponse() live in `app/src/lib/api.ts`

## npm package

`@pixabots/core` is published on npm (v0.1.0). After changes to `packages/core/`:
1. Bump version in `packages/core/package.json`
2. `cd packages/core && pnpm build && npm publish --access public`

designteam.app currently inlines `randomPixabotId()` — should swap for `@pixabots/core`'s `randomId()` now that it's published.

## Adding new parts

1. Add PNGs to `art/png/{category}/`
2. Copy to `app/public/parts/{category}/`
3. **Append** to the arrays in `packages/core/src/parts.ts` (never reorder!)
4. Rebuild: `pnpm --filter @pixabots/core build`
5. Bump version + republish to npm

## API

- `GET /api/pixabot/{id}` — PNG image. `?size=32|64|128|240|480|960`, `?format=json` for metadata, `?animated=true` for animated GIF (capped at 480px)
- `GET /api/pixabot/random` — 302 redirect to random pixabot (or `?format=json`)
- JSON responses include `png` and `gif` URLs
- OpenAPI 3.1 spec at `/openapi.json`
- CORS enabled, immutable caching on deterministic endpoints

## Deployment

- Vercel, root directory is `.` (project root)
- `vercel.json` handles pnpm monorepo build: builds @pixabots/core first, then the Next.js app in `app/`
- `packageManager: pnpm@9.0.6` in root package.json
- Vercel project: `app` under pablostanley's team

## Related projects

- **designteam.app** (`/Users/pablostanley/Dropbox/designteam`, repo: pablostanley/designteam-app) — first consumer of the Pixabots API. Agents get `pixabotId` field, avatars render via `https://pixabots.com/api/pixabot/{id}?size=240`. PR #3 has the integration.
