# Pixabots

Pixel character creator built with Next.js, shadcn/ui, and GeistPixel font.

@AGENTS.md

## Project structure

- `src/app/page.tsx` — main UI (client component)
- `src/lib/parts.ts` — character parts config (categories, options, file paths, display labels)
- `public/parts/{body,eyes,heads,top}/` — 32x32 PNG sprites
- `src/app/fonts/GeistPixel-Square.woff2` — pixel font

## Key conventions

- All UI text uses GeistPixel Square font — prefer font glyphs over icon libraries
- Images are 32x32px pixel art, rendered on canvas with `imageSmoothingEnabled = false` and CSS `image-rendering: pixelated`
- Z-index layer order (bottom to top): top, body, heads, eyes
- The "eyes" category displays as "face" in the UI (see `layerLabel` in parts.ts)
- shadcn preset is `radix-lyra` with phosphor icons (though we use font glyphs instead)
- Dark mode is the default

## Adding new parts

When the user says they added new images:
1. Read `png/` subfolders to find new files
2. Copy new PNGs to `public/parts/`
3. Update `src/lib/parts.ts` with new entries
