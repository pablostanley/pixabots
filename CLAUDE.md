# Pixabots

Pixel character creator and avatar API. 10,752 unique combinations from 4 categories of 32x32 sprites.

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

## npm packages

`@pixabots/core`, `@pixabots/react`, and `pixabots` (CLI) all publish to npm. **Publishing is automated** via `.github/workflows/publish-{core,react,cli}.yml` — the agent can release new versions end-to-end by pushing a git tag. No local `npm login` / `npm publish` needed; the `NPM_TOKEN` lives only in the GitHub repo secret.

Release flow (per package):
1. Bump `version` in the package's `package.json`.
2. Commit + push to main (via PR).
3. `git tag {pkg}-v<new-version> && git push origin {pkg}-v<new-version>` — where `{pkg}` is `core`, `react`, or `cli`.
4. Workflow builds, runs smoke tests (core only), and publishes.

Monitor with `gh run list --workflow=publish-{core,react,cli}.yml`.

**CLI publish caveat:** the `pixabots` package is unscoped, so the `NPM_TOKEN` (granular, scoped to `@pixabots/*`) can't write to it yet. Expand the token's package allow-list to include `pixabots` before running `publish-cli.yml`.

designteam.app currently inlines `randomPixabotId()` — should swap for `@pixabots/core`'s `randomId()` now that it's on npm.

## Adding new parts

1. Add PNGs to `art/png/{category}/`
2. Copy to `app/public/parts/{category}/`
3. **Append** to the arrays in `packages/core/src/parts.ts` (never reorder!)
4. Rebuild: `pnpm --filter @pixabots/core build`
5. Bump version + push `core-v<new>` tag — the publish workflow ships it to npm

### Multi-frame sprites (sub-animations)

A part can ship a horizontal sprite sheet (width = `frames × 32`, height = 32) for per-tick sub-animations like blinking or looking around.

1. Draw the sheet frames left-to-right, single PNG
2. In `packages/core/src/parts.ts` set `frames: N` on the part entry (default 1)
3. Edit `FRAME_INDICES[category]` in `packages/core/src/animation.ts` to schedule frames per tick (array length = ANIM_FRAMES length)
4. Parts in the same category with fewer frames automatically fall back to frame 0 — safe to mix multi-frame and single-frame parts.

Body sub-animations aren't wired yet (the feet-planted split needs per-frame top/bottom rows); heads/eyes/top are ready.

## API

- `GET /api/pixabot/{id}` — PNG image. `?size=<any integer 32–1920>`, `?format=json` for metadata, `?animated=true` for animated GIF (all sizes supported), `?speed=0.25–4` for animation speed
- `GET /api/pixabot/random` — 302 redirect to random pixabot (or `?format=json`)
- JSON responses include `png` and `gif` URLs
- OpenAPI 3.1 spec at `/openapi.json`
- CORS enabled, 1-day fresh + 7-day stale-while-revalidate caching on deterministic endpoints (see `DETERMINISTIC_CACHE` in `app/src/lib/api.ts`)

## Deployment

- Vercel, root directory is `.` (project root)
- `vercel.json` handles pnpm monorepo build: builds @pixabots/core first, then the Next.js app in `app/`
- `packageManager: pnpm@9.0.6` in root package.json
- Vercel project: `app` under pablostanley's team

## Related projects

- **designteam.app** (`/Users/pablostanley/Dropbox/designteam`, repo: pablostanley/designteam-app) — first consumer of the Pixabots API. Agents get `pixabotId` field, avatars render via `https://pixabots.com/api/pixabot/{id}?size=240`. PR #3 has the integration.
