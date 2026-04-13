# Pixabots

Pixel character creator. Combine 32x32 pixel art layers to build unique characters.

## Parts

Characters are built from 4 layers (bottom to top):

- **Top** — antenna, bulb, bunny ears, leaf, lollypop, mohawk
- **Body** — backpack, claws, heart, swag, tank, wings
- **Heads** — ac, blob, blob-blue, bowl, box, commodore, frame, punch-bowl
- **Face** — glasses, human, human-2, monitor, monitor-round, terminal, terminal-light, terminal-round, visor

## Usage

```
npm install
npm run dev
```

Open http://localhost:3000

- Click a part button to cycle through options
- Click the dropdown to pick a specific option
- Shuffle randomizes everything
- Download exports at 240, 480, 960, or 1920px with no antialiasing

## Adding new parts

Drop new 32x32 PNGs into the appropriate folder under `public/parts/` (body, eyes, heads, top), then update `src/lib/parts.ts` with the new entries.

## Stack

- Next.js + TypeScript
- shadcn/ui (radix-lyra preset)
- GeistPixel Square font
- Canvas API for compositing and export

## Author

Made by [Pablo Stanley](https://x.com/pablostanley) — [Substack](https://pablostanley.substack.com) / [X](https://x.com/pablostanley)

## License

[MIT](LICENSE)
