# Pixabots Roadmap

## Done

- [x] `@pixabots/core` npm package — v0.1.0 published (ID system, parts catalog, random/seeded generation)
- [x] API routes — `GET /api/pixabot/{id}` (PNG + JSON) and `/api/pixabot/random`
- [x] Animated API — `GET /api/pixabot/{id}?animated=true` returns animated GIF (capped at 480px)
- [x] OpenAPI 3.1 spec at `/openapi.json`
- [x] Docs site — Fumadocs at `/docs` with API reference, SDK, parts catalog, shared header/footer, full SEO metadata
- [x] Homepage — pixabot ID, Copy URL, PNG/GIF/JSON links, labeled action buttons
- [x] designteam.app integration — pixabotId on Agent, avatar rendering via API (PR #3)
- [x] Monorepo restructure — app/, packages/core/, art/, marketing/
- [x] Pixelify Sans font + pixelarticons icon set
- [x] Shared API helpers — CORS, image responses, immutable caching
- [x] Parallel layer loading and frame rendering
- [x] Vercel monorepo deployment config
- [x] Responsive creator — fluid canvas, icon-only buttons on mobile, 2x2 part grid
- [x] Housekeeping — removed GeistPixel, @phosphor-icons/react, fixed AGENTS.md, generate-grids.mjs
- [x] Clearer ID bar UX — redesigned with labeled PNG/GIF/JSON links and Copy URL button

## Up Next

- [ ] **System theme detection** — default to system preference instead of forced dark mode. The header theme toggle should sync with OS preference on first load.
- [ ] **Merge designteam PR #3** — the integration is built, just needs to be merged on the designteam side. Then swap inlined `randomPixabotId()` for `@pixabots/core`'s `randomId()`.
- [ ] **Lighter dark-mode checkerboard** — the transparent grid background needs more contrast with the bots
- [ ] **Error handling in render** — if a sprite PNG is missing, the API returns a raw 500. Wrap in try/catch for a cleaner 404.
- [ ] **1920px API size** — AGENTS.md lists 1920 as a valid download size, but `VALID_SIZES` in the API only goes up to 960. Add 1920 to the API.

## Polish

- [ ] **Background color picker** — transparent by default, but let users pick a color for exports
- [ ] **Custom pixel tooltips** — replace native browser tooltips with styled ones using our pixel font
- [ ] **Body clipping in animated GIF** — client-side animation keeps the body's bottom row planted ("feet stay planted"), but the GIF renderer doesn't replicate this
- [ ] **Active nav state** — header nav links should highlight the current page (create vs docs)
- [ ] **Loading state** — show a skeleton or spinner while the canvas loads images on first render
- [ ] **Keyboard shortcuts** — arrow keys to cycle parts, space to shuffle, s to save
- [ ] **Share URL** — `pixabots.com/?id=2156` that opens the creator with a specific combo pre-loaded

## Ideas

- [ ] More parts — new variations for each category. Append-only to keep IDs stable.
- [ ] Color/palette system — tint or recolor layers (expand beyond 9,856 combos)
- [ ] `@pixabots/react` package — `<Pixabot id="f76a" />` component with canvas rendering
- [ ] `npx pixabots` CLI — generate random pixabots from the terminal
- [ ] Accessories — new category layer (hats, items, etc.)
- [ ] Animation variants — wave, jump, spin, etc.
- [ ] Social cards — `GET /api/pixabot/{id}/og` for Open Graph images with name/title
- [ ] Batch API — generate multiple pixabots in one request
- [ ] SVG output — vector version alongside PNG
- [ ] WebP animated output — smaller than GIF, better quality
- [ ] Gallery page — browse all 9,856 combinations, search/filter by parts
- [ ] Embed widget — `<script>` tag or iframe for embedding a pixabot in any site
- [ ] GitHub avatar integration — use as profile pic via URL
- [ ] Rate limiting — protect the API from abuse (especially animated endpoint)
- [ ] Analytics — track which pixabots are most popular, API usage stats
