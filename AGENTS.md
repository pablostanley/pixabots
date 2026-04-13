<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pixabots agent rules

- Use GeistPixel font glyphs for icons when possible (check cmap before using a char — `*`, `•`, `↔`, `↓`, `▲`, `◊`, arrows are confirmed in the font)
- Pixel art must never be antialiased — always set `imageSmoothingEnabled = false` on canvas and use `image-rendering: pixelated` in CSS
- Download sizes: 240, 480, 960, 1920 — all rendered from 32x32 source with nearest-neighbor scaling
- The `@phosphor-icons/react` package uses `*Icon` naming (e.g. `SunIcon` not `Sun`) — the old names are deprecated
