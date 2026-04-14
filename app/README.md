# Pixabots

Pixel character creator. Mix and match 32x32 pixel art layers to build unique characters, animate them, and download at any size.

**[pixabots.com](https://pixabots.com)**

## How it works

Characters are built from 4 layers stacked on top of each other:

| Layer | Options |
|-------|---------|
| **Top** | antenna, bulb, bun, bunny-ears, horns, leaf, lollypop, mohawk |
| **Body** | backpack, claws, fire, heart, swag, tank, wings |
| **Heads** | ac, blob, blob-blue, bowl, box, commodore, frame, punch-bowl |
| **Face** | big-face, glasses, human, human-2, monitor, monitor-round, mustache, terminal, terminal-green, terminal-light, terminal-round, tight-visor, visor, wayfarer |

### Controls

- **Click a part button** to cycle to the next option
- **Click the dropdown arrow** to pick a specific option from the list
- **`↔` Shuffle** randomizes all parts
- **`▲` Play/Stop** toggles the idle bounce animation
- **`*` Theme** switches between dark and light mode
- **`↓` Download** exports at 240, 480, 960, or 1920px (pixel-perfect, no antialiasing)

## Run locally

```
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000)

## Adding new parts

1. Drop new 32x32 PNGs into the folder under `public/parts/` (`body`, `eyes`, `heads`, or `top`)
2. Add the entry in `src/lib/parts.ts`

## Stack

- [Next.js](https://nextjs.org) + TypeScript
- [shadcn/ui](https://ui.shadcn.com) (radix-lyra preset)
- [GeistPixel](https://vercel.com/font) Square font
- Canvas API for compositing, animation, and export

## Author

Made by [Pablo Stanley](https://x.com/pablostanley) — [Substack](https://pablostanley.substack.com) / [X](https://x.com/pablostanley)

## License

[MIT](LICENSE)
