<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pixabots agent rules

- Font: Pixelify Sans (Google Fonts via `next/font/google`), all weights 400–700
- Icons: pixelarticons SVGs inlined via `PixelIcon` component (`src/components/ui/pixel-icon.tsx`). Add new icons by copying the SVG path data into that file.
- Pixel art must never be antialiased — always set `imageSmoothingEnabled = false` on canvas and use `image-rendering: pixelated` in CSS. Sharp must use `kernel: sharp.kernel.nearest`.
- Download sizes: 240, 480, 960, 1920 — all rendered from 32x32 source with nearest-neighbor scaling
- Parts arrays in `@pixabots/core` are append-only — never reorder or remove entries
- Animation data lives in `@pixabots/core` (`packages/core/src/animation.ts`) — import from there, don't duplicate
- Shared API helpers (CORS, image responses) live in `src/lib/api.ts`
