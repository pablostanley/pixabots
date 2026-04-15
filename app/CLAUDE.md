# Pixabots App

Next.js app — creator UI + API routes. Part of the pixabots monorepo.

See root `CLAUDE.md` for project-wide conventions and `ROADMAP.md` for what's next.

@AGENTS.md

## App structure

- `src/app/page.tsx` — main creator UI (client component)
- `src/app/api/pixabot/[id]/route.ts` — PNG/JSON endpoint
- `src/app/api/pixabot/random/route.ts` — random pixabot endpoint
- `src/lib/parts.ts` — re-exports from `@pixabots/core` with app-specific `/parts/` URL prefix
- `src/lib/render.ts` — Sharp server-side compositing
- `src/components/ui/pixel-icon.tsx` — inlined pixelarticons SVGs
- `public/parts/{body,eyes,heads,top}/` — 32x32 PNG sprites
- `public/openapi.json` — OpenAPI 3.1 spec

## Key conventions

- Font: Pixelify Sans (all weights), via `next/font/google`
- Icons: pixelarticons via `PixelIcon` component (not font glyphs)
- Pixel art: `imageSmoothingEnabled = false`, `image-rendering: pixelated`
- Layer order (bottom to top): top, body, heads, eyes
- The "eyes" category displays as "face" in the UI (`layerLabel` in parts.ts)
- Parts source of truth is `@pixabots/core` (`packages/core/src/parts.ts`)
