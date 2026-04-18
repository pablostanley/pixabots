# Pixabots

Pixel character creator and avatar API. Mix and match 32x32 pixel art layers to build 9,856 unique characters, animate them, and use them anywhere via API.

**[pixabots.com](https://pixabots.com)**

## How it works

Characters are built from 4 layers stacked on top of each other:

| Layer | Options |
|-------|---------|
| **Top** | antenna, bulb, bun, bunny-ears, disco, horns, leaf, lollypop, mohawk, plant, radar |
| **Body** | backpack, claws, fire, heart, swag, tank, wings |
| **Heads** | ac, blob, blob-blue, bowl, box, commodore, frame, punch-bowl |
| **Face** | big-face, cheeky-terminal, glasses, human, human-2, monitor, monitor-round, mustache, terminal, terminal-green, terminal-light, terminal-round, tight-visor, visor, wayfarer, wayfarer-face |

Every combination gets a unique 4-character ID (e.g. `2156`, `f76a`). Same combo = same ID, always.

## API

```
GET /api/pixabot/2156                     → PNG (128px default)
GET /api/pixabot/2156?size=480            → PNG at 480px (any multiple of 32 from 32 to 1920)
GET /api/pixabot/2156?animated=true       → animated GIF (all sizes supported)
GET /api/pixabot/2156?animated=true&speed=2 → faster animation (0.25–4)
GET /api/pixabot/2156?format=json         → metadata + URLs
GET /api/pixabot/random                   → random pixabot
```

CORS enabled on every response — embed from anywhere.

Full spec at [`/openapi.json`](https://pixabots.com/openapi.json).

## Run locally

```
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000)

## Project structure

```
pixabots/
  app/              — Next.js app (creator UI + API routes)
  packages/core/    — @pixabots/core (ID system, parts catalog, animation)
  art/png/          — source sprites (32x32 PNGs)
  marketing/        — grid images
```

## Adding new parts

1. Add 32x32 PNGs to `art/png/{category}/`
2. Copy to `app/public/parts/{category}/`
3. **Append** to the arrays in `packages/core/src/parts.ts` (never reorder!)
4. Rebuild: `pnpm --filter @pixabots/core build`

## Stack

- [Next.js](https://nextjs.org) + TypeScript
- [shadcn/ui](https://ui.shadcn.com) (radix-lyra preset)
- [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) font
- [pixelarticons](https://pixelarticons.com) icon set
- [Sharp](https://sharp.pixelplumbing.com) for server-side PNG/GIF rendering
- Canvas API for client-side compositing and animation

## Author

Made by [Pablo Stanley](https://x.com/pablostanley) — [Substack](https://pablostanley.substack.com) / [X](https://x.com/pablostanley)

## License

[MIT](LICENSE)
