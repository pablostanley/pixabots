# Pixabot creator starter

Minimal Vite + React + TypeScript app that renders a working Pixabots creator in ~150 LOC. Pair with [/docs/creator](https://pixabots.com/docs/creator).

## What's included

- Canvas render loop composing the four parts (top → body → heads → eyes)
- Space to shuffle, arrow keys to cycle each category
- Hue + saturation sliders via CSS `filter` (instant recolor, no round-trip)
- URL sync (`?id=2156` round-trips across refresh)
- Single-file App, one stylesheet, no design system

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173. Space to shuffle.

## Deploy

Static output, works anywhere. Vercel / Netlify / Cloudflare Pages — point them at this folder. No env vars required.

```bash
pnpm build
# dist/ contains the static site
```

## Adapt

Everything interesting lives in `src/App.tsx`. It's deliberately one file; lift what you need into your own component tree, skip what you don't.

Sprite assets are fetched from `https://pixabots.com/parts/{category}/{name}.png`. The production Pixabots app serves them with CORS + immutable caching, so no proxy needed.

For patterns beyond this starter (Fx inspector, undo/redo, Konami shuffle, SFX, pixel materialize, download menu), read the production creator source: [`app/src/app/creator.tsx`](https://github.com/pablostanley/pixabots/blob/main/app/src/app/creator.tsx).
