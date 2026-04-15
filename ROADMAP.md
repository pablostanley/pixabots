# Pixabots Roadmap

## Done

- [x] `@pixabots/core` npm package (ID system, parts catalog, random/seeded generation)
- [x] API routes — `GET /api/pixabot/{id}` (PNG + JSON) and `/api/pixabot/random`
- [x] Animated API — `GET /api/pixabot/{id}?animated=true` returns animated GIF (capped at 480px)
- [x] OpenAPI 3.1 spec at `/openapi.json`
- [x] Homepage shows pixabot ID, links, copy URL, and gif link
- [x] designteam.app integration (pixabotId on Agent, avatar rendering via API)
- [x] Monorepo restructure (app/, packages/core/, art/, marketing/)
- [x] Pixelify Sans font (replaced GeistPixel)
- [x] pixelarticons icon set (replaced font glyphs)
- [x] Shared API helpers (CORS, image responses, immutable caching)
- [x] Parallel layer loading and frame rendering
- [x] Vercel monorepo deployment config

## Up Next

- [ ] **Docs site** — Fumadocs at `/docs` with API reference, SDK guide, usage examples, and interactive playground
- [ ] **Publish `@pixabots/core` to npm** — so anyone can encode/decode IDs, generate random pixabots client-side. Once published, swap designteam's inlined `randomPixabotId()` for the real package.
- [ ] **AGENTS.md cleanup** — still references GeistPixel font glyphs and phosphor icons, needs updating for Pixelify Sans + pixelarticons
- [ ] **Remove old GeistPixel font file** — `app/src/app/fonts/GeistPixel-Square.woff2` is still on disk but no longer imported

## Polish

- [ ] **Clearer ID bar UX** — the ID/json/960px/gif/copy row isn't obvious to users. Needs better labels or a more intuitive layout (maybe a "share" or "embed" framing?)
- [ ] **System theme detection** — default to system preference instead of forced dark mode
- [ ] **Lighter dark-mode checkerboard** — the transparent grid background needs more contrast with the bots
- [ ] **Background color picker** — transparent by default, but let users pick a color for exports
- [ ] **Custom pixel tooltips** — replace native browser tooltips with styled ones using our pixel font
- [ ] **Footer polish** — subtler text color, more spacing between links
- [ ] **Body clipping in animated GIF** — client-side animation keeps the body's bottom row planted ("feet stay planted"), but the GIF renderer doesn't replicate this. Subtle visual difference.
- [ ] **1920px download size** — AGENTS.md lists 1920 as a valid download size, but `VALID_SIZES` in the API only goes up to 960. Add 1920 or update AGENTS.md.
- [ ] **Error handling in render** — if a sprite PNG is missing, the API returns a raw 500. Wrap in try/catch for a cleaner error.

## Ideas

- [ ] More parts — new variations for each category (eyes, heads, body, top). Append-only to keep IDs stable.
- [ ] Color/palette system — tint or recolor layers (expand beyond 9,856 combos)
- [ ] `@pixabots/react` package — `<Pixabot id="f76a" />` component with canvas rendering
- [ ] `npx pixabots` CLI — generate random pixabots from the terminal
- [ ] Backgrounds — optional background colors/patterns behind the character
- [ ] Accessories — new category layer (hats, items, etc.)
- [ ] Animation variants — wave, jump, spin, etc.
- [ ] Social cards — `GET /api/pixabot/{id}/og` for Open Graph images with name/title
- [ ] Batch API — generate multiple pixabots in one request
- [ ] SVG output — vector version alongside PNG
- [ ] WebP animated output — smaller than GIF, better quality
- [ ] Gallery page — browse all 9,856 combinations, search/filter by parts
- [ ] Embed widget — `<script>` tag or iframe for embedding a pixabot in any site
- [ ] GitHub avatar integration — use as profile pic via URL
