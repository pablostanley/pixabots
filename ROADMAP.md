# Pixabots Roadmap

## Done

- [x] `@pixabots/core` npm package (ID system, parts catalog, random/seeded generation)
- [x] API routes — `GET /api/pixabot/{id}` (PNG + JSON) and `/api/pixabot/random`
- [x] OpenAPI 3.1 spec at `/openapi.json`
- [x] Homepage shows pixabot ID, links, and copy URL
- [x] designteam.app integration (pixabotId on Agent, avatar rendering)
- [x] Monorepo restructure (app/, packages/core/, art/, marketing/)

## Up Next

- [ ] **Docs site** — Fumadocs at `/docs` with API reference, SDK guide, usage examples, and interactive playground
- [ ] **Publish `@pixabots/core` to npm** — so anyone can encode/decode IDs, generate random pixabots client-side
- [ ] **Animated exports** — GIF/APNG/WebP export of the bounce animation (the idle animation already exists client-side)
- [ ] **More parts** — new variations for each category (eyes, heads, body, top). Append-only to keep IDs stable.

## Ideas

- [ ] Color/palette system — tint or recolor layers (expand beyond 9,856 combos)
- [ ] `@pixabots/react` package — `<Pixabot id="f76a" />` component with canvas rendering
- [ ] `npx pixabots` CLI — generate random pixabots from the terminal
- [ ] Backgrounds — optional background colors/patterns behind the character
- [ ] Accessories — new category layer (hats, items, etc.)
- [ ] Animation variants — wave, jump, spin, etc.
- [ ] Social cards — `GET /api/pixabot/{id}/og` for Open Graph images
- [ ] Batch API — generate multiple pixabots in one request
- [ ] SVG output — vector version alongside PNG
