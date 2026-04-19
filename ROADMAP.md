# Pixabots Roadmap

## Done

- [x] `@pixabots/core` npm package — v0.1.0 published (ID system, parts catalog, random/seeded generation)
- [x] API routes — `GET /api/pixabot/{id}` (PNG + JSON) and `/api/pixabot/random`
- [x] Animated API — `GET /api/pixabot/{id}?animated=true` returns animated GIF (all sizes up to 1920px)
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
- [x] System theme detection — reads OS prefers-color-scheme on mount
- [x] Lighter dark-mode checkerboard — bumped contrast for dark pixel art
- [x] Error handling in render — RenderError class, 404 for missing sprites, clean JSON errors
- [x] 1920px API size — added to VALID_SIZES, OpenAPI spec, and docs
- [x] designteam.app integration merged — PR #3 merged, `@pixabots/core` swapped in as real dep
- [x] Housekeeping — removed GeistPixel, @phosphor-icons/react, fixed AGENTS.md, generate-grids.mjs
- [x] Clearer ID bar UX — redesigned with labeled PNG/GIF/JSON links and Copy URL button
- [x] Browse page — `/browse` grid, animated pixabots, 2x speed on hover, infinite scroll, hover actions
- [x] Speed param on animated API — `?speed=0.25–4` multiplier
- [x] Feet-stay-planted in animated GIF — body bottom row fixed
- [x] useCopyToClipboard shared hook — reused across home + browse
- [x] OG image API — `/api/og?type=grid|single` with seeded pixabots + Pixelify Sans via opentype.js
- [x] Per-bot pages — `/bot/[id]` with full SEO metadata, canonical URL, parts table
- [x] Favicons — icon.png + apple-icon.png from pixabot 2156
- [x] Sitemap + robots.txt
- [x] Home autoplay — animation starts on mount, no checkerboard bg
- [x] Browse modal — clicking a card opens a dialog at `/bot/{id}`, ESC/outside dismisses back to grid, refresh shows full page
- [x] API hardening — 60 sizes (multiple of 32 up to 1920), animations all sizes, `/random` forwards `animated`/`speed`, strict input validation (size/speed return 400 on invalid), render memory cut ~8x at large sizes, OpenAPI gaps closed (/api/og documented)
- [x] Prev/next bot navigation — `<` `>` buttons + ArrowLeft/ArrowRight on BotDetail. Works in dialog and on full page. Combo-index walks 9,856 bots in stable order with wrap. `router.replace` so back still returns to `/browse`. (PR #14)
- [x] Mobile bottom sheet — dialog anchors to bottom edge and slides up on mobile, stays centered on desktop. Drag-handle affordance. ESC + outside tap dismiss. Drag-to-dismiss tracked as ticket #15. (PR #15)
- [x] Sticky header — `SiteHeader` is `sticky top-0`, hides on scroll down past 20px, reveals on scroll up, backdrop-blur + bg/80 when scrolled. Scroll tracked via useSyncExternalStore. Respects prefers-reduced-motion. (PR #16)
- [x] Browse prefetch — `mouseenter` on non-featured cards fires background fetch for the 480 animated the detail view renders. Click → cache-hit. (PR #17)
- [x] Sprite preload on home — server-rendered `<link rel="preload">` for all 42 sprite PNGs, hoisted to head by React 19. First shuffle draws without network; every subsequent shuffle cache-hit. (PR #18)
- [x] 404 page — custom not-found.tsx with random animated pixabot, personality copy, links to Home/Browse/#{id}. Catches invalid `/bot/{id}` and any unknown route. (PR #19)
- [x] Animated copy feedback — check icon pops via `animate-in zoom-in-50 fade-in-0`; creator label slides + fades to "Copied!". Auto-resets 1.5s later. (PR #20)
- [x] Web Share API — `useShareOrCopy` calls `navigator.share()` when available (mobile native sheet), falls back to clipboard. Old `useCopyToClipboard` removed. (PR #21)
- [x] `prefers-reduced-motion` — creator freezes to static frame; browse serves static PNG + skips fast GIF; bot detail + 404 use `<picture>` with media source so the browser swaps to PNG server-side. (PR #22)
- [x] aria-live shuffle announcement — sr-only polite region in creator reads out the new ID + parts on every selection change. (PR #23)
- [x] Focus-visible outline — global `:focus-visible { outline: 2px solid var(--ring) }` in `globals.css`. Covers every previously-ringless element. (PR #24)
- [x] Contrast audit — `--muted-foreground` raised in both themes (light 0.556→0.45, dark 0.708→0.76) so every muted label passes WCAG AA. (PR #25)
- [x] Shortcuts help overlay + C to copy — `?` opens per-route help dialog, `C` copies share URL in creator. (PR #26)
- [x] Command palette — `⌘K` / `Ctrl+K` opens a filtered action list: navigation, jump-by-ID, copy URL, random. (PR #27)
- [x] Theme without useEffect — `useTheme` hook (useSyncExternalStore) + pre-hydration script kills flash-of-wrong-theme; localStorage persistence added. (PR #28)
- [x] D opens Download menu — controlled DropdownMenu in creator + `D` keydown. (PR #29)
- [x] Drag-to-dismiss — mobile bottom sheet can be swiped down to close; 80px / 0.5 px/ms threshold, scrollTop gate. No new deps. (PR #30)
- [x] Bot-page embed tabs — URL / HTML / Markdown / React snippets with copy buttons on `/bot/[id]`. (PR #31)
- [x] PWA manifest — `app/manifest.ts` emits `/manifest.webmanifest`; installable on iOS and Android with the pixabot icon. (PR #32)
- [x] First-shuffle hint — coachmark above ID bar dismissed on first selection change, persisted via localStorage. (PR #33)
- [x] Lock layers — per-category lock gate on shuffle, toggled from each category dropdown. (PR #34)
- [x] Konami rapid shuffle — ↑↑↓↓←→←→BA on creator runs 20 shuffles at 80ms. (PR #35)
- [x] Favorites — star/unstar on BotDetail + browse cards; `/favorites` page with empty state; nav link + command-palette action. (PR #36)
- [x] GIF encoding — `effort: 10` on Sharp's `.gif()` for smaller palette-optimized files. Immutable cache means render-once, serve-forever. (PR #37)
- [x] Compare view — `/compare?ids=a,b,…` renders up to 6 BotDetails side by side; Favorites page gets a Compare CTA. (PR #38)
- [x] Footer discovery copy — "9,856 combos · SPACE · ? for shortcuts" in footer. (PR #39)
- [x] Background color picker — 9-swatch row paints behind the canvas + bakes into downloaded PNGs. (PR #40)
- [x] BotDetail tilt — subtle 3D rotate on pointer hover, respects reduce-motion. (PR #41)
- [x] Browse skeleton — muted pulse layer until each card's GIF loads; motion-safe pulse. (PR #42)
- [x] Creator boot fade — motion-safe soft reveal on mount. (PR #43)
- [x] Pixel tooltips — CSS-only `data-tooltip` with styled popover + fade; icon buttons swapped from `title=`. (PR #44)
- [x] Opt-in SFX — ♪ header toggle + Web Audio square-wave blips on shuffle/copy/cycle, off by default. (PR #45)
- [x] Service worker — cache-first for `/api/pixabot/*` (excl random) + `/parts/*`; instant repeat loads and partial offline. (PR #46)
- [x] Gallery mode — fullscreen single-bot dialog with Edit + Get PNG actions. (PR #47)
- [x] Size=240 regression fix — API validator widened to any integer 32–1920 (dropped multiple-of-32 requirement). Restored browse card rendering. (PR #48)
- [x] Shuffle hint position — moved below the ID bar so actions lead. (PR #49)
- [x] Canvas pulse on part change — subtle 180ms scale pulse on shuffle/cycle/pick. (PR #50)
- [x] Special-ID captions — small note on BotDetail for curated IDs (2156, 1337, 0000, f76a, 0001). (PR #51)
- [x] WebP animated output — `?webp=true` on API returns animated WebP via Sharp; smaller + alpha preserved. Random forwards it. Docs + OpenAPI synced. (PR #52)
- [x] Musical SFX — per-action pentatonic scales, softer triangle + lowpass voice, download jingle, color swatches as ascending notes. (PR #53)
- [x] Batch API — `/api/pixabot/batch?ids=...` (100 max) or `?count=N` for bulk metadata. (PR #54)
- [x] Browse filters — per-category dropdown filter, URL-driven. (PR #55)
- [x] Embed widget — `/embed/[id]` iframe-ready route with size/animated/bg params; BotEmbed gains Iframe tab. (PR #56)
- [x] SVG output — `?format=svg` returns pixel-perfect vector; one rect per opaque pixel, scales without interpolation. (PR #57)
- [x] `@pixabots/react` package — new workspace package exporting `<Pixabot>` component with full prop API. Built, not yet published. (PR #58)
- [x] BgPicker popover — single swatch next to part selectors opens a popover with HSL picker, hex input, and preset swatches. react-colorful dep. (PR #59)
- [x] `pixabots` CLI — new workspace package; ANSI truecolor terminal render, --info, --save, --json. (PR #60)
- [x] Palette API — `?hue` + `?saturate` for recoloring any pixabot via Sharp modulate. Works on PNG/GIF/WebP. (PR #61)
- [x] Multi-frame sprite infra — `@pixabots/core` 0.2.0: `PartOption.frames` + `FRAME_INDICES`. Render extracts correct frame per-tick per-layer with safe frame-0 fallback. Ready for eye-blink / heads-wiggle / top-spin art. (PR #62)
- [x] Creator hue slider — live `filter: hue-rotate` preview; baked into PNG download + URL params on PNG/GIF links. (PR #63)
- [x] Usage patterns doc — `/docs/usage` with copy-ready recipes (README, webhooks, seeded avatars, wall, branded). (PR #64)
- [x] Creator saturation slider — pairs with hue; both bake into download and URL params. (PR #65)
- [x] Palette URL sync — `?hue` + `?saturate` on home page round-trip through URL, sliders restore, share URL carries palette. (PR #66)
- [x] BotDetail palette — `/bot/[id]?hue=&saturate=` renders recolored; Edit + download links carry palette forward. (PR #67)
- [x] Palette propagation — OG image / canonical URL / BotNav prev-next all preserve `hue`+`saturate`. (PR #68)
- [x] Embed widget + React component palette — `/embed/[id]` and `@pixabots/react` v0.2.0 both accept `hue`/`saturate`. Palette now reaches every public surface. (PR #69)
- [x] CLI + Compare palette — `pixabots` v0.2.0 gets `--hue`/`--saturate`; `/compare?hue=&saturate=` threads to every compared bot. (PR #70)

## Up Next

Prioritized tickets to work through. Each is self-contained and shippable.

### 1. ~~Prev / next navigation in browse dialog~~ — **shipped (PR #14)**

### 2. ~~Mobile bottom sheet for bot detail~~ — **shipped (PR #15)**

### 3. ~~Sticky header with scroll behavior~~ — **shipped (PR #16)**

### 4. ~~Prefetch bot PNG on browse card hover~~ — **shipped (PR #17)**

### 5. ~~Preload sprite parts on creator mount~~ — **shipped (PR #18)**

### 6. ~~404 page with lost pixabot~~ — **shipped (PR #19)**

### 7. ~~Animated copy-button feedback~~ — **shipped (PR #20)**

### 8. ~~Web Share API on mobile~~ — **shipped (PR #21)**

### 9. ~~a11y — `prefers-reduced-motion`~~ — **shipped (PR #22)**

### 10. ~~a11y — aria-live shuffle announcement~~ — **shipped (PR #23)**
Browse-hover announcement deemed out of scope: hovering each card in a grid of 60 would spam the screen reader. Kept to creator where intent matches user action.

### 11. ~~a11y — focus ring audit~~ — **shipped (PR #24)**

### 12. ~~a11y — contrast audit~~ — **shipped (PR #25)**
Expanded beyond dark mode: light mode also had a muted-foreground regression (~4.0:1). Both themes now pass AA.

### 13. ~~Expanded keyboard shortcuts + help overlay~~ — **shipped (PR #26)**
Shipped: `?` help overlay, `C` copy URL in creator. Descoped: `D` download menu (imperative radix) → ticket #17; `/` command palette focus → bundled with ticket #14.

### 17. ~~`D` shortcut to open download menu~~ — **shipped (PR #29)**

### 16. ~~SiteHeader theme detection via useEffect~~ — **shipped (PR #28)**
Shipped: `useTheme` hook (useSyncExternalStore), pre-hydration inline script in layout `<head>` prevents flash of wrong theme, `localStorage` persistence added as a bonus.

### 15. ~~Drag-to-dismiss on mobile bottom sheet~~ — **shipped (PR #30)**
Custom pointer-event implementation — no vaul dependency. 80px or 0.5 px/ms velocity threshold. scrollTop gate prevents scroll conflict.

### 14. ~~Command palette (⌘K)~~ — **shipped (PR #27)**
Shipped: navigation (Home, Browse, Docs, API, SDK, Parts, Random), jump-by-ID (valid 4-char surfaces open action), copy URL. Descoped (creator-state-coupled actions): part-picking, download, play/stop — would require lifting creator state into context. Leave as future enhancement if requested.

## Polish

### UI
- [ ] **Mobile bottom sheet** — use a bottom sheet instead of centered dialog on mobile for bot detail
- [ ] **Sticky header with scroll behavior** — hide on scroll down, reveal on scroll up; backdrop blur
- [ ] **Focus rings everywhere** — audit all interactive elements for visible keyboard focus
- [ ] **"You might also like"** — on bot page, show 4 one-part-different variants

### Speed & perf
- [ ] **Prefetch bot detail on browse hover** — Next.js `<Link prefetch>` already partial; extend to PNG preload
- [ ] **Preload sprite parts on creator mount** — 42 tiny PNGs fetched in parallel so first shuffle is instant
- [ ] **Next shuffle preloaded** — generate+preload the next random ID behind the scenes; shuffle becomes 0ms
- [ ] **WebP animated output** — smaller than GIF with alpha support (see Ideas)

### Messaging & copy
- [ ] **Personality in empty states / 404** — "this pixabot got lost" + random pixabot on 404 page
- [ ] **Copy-button state polish** — animated check that fades back to copy icon, accompanied by "Copied URL"
- [ ] **Error messages match voice** — API 400s stay plain, but UI error states use the pixel vibe
- [ ] **Share via Web Share API on mobile** — native share sheet instead of copy-URL-only

### Accessibility & comfort
- [ ] **`prefers-reduced-motion` support** — freeze idle bounce, disable hover "speed up" on browse
- [ ] **Screen-reader announcements on shuffle** — `aria-live` region announces the new ID
- [ ] **High-contrast focus + checkered BG** — audit dark mode for AA contrast on all text
- [ ] **Command palette (⌘K)** — quick jump to ID, Browse, Docs, Random; monospace-style UI matches vibe

### Delight
- [ ] **Easter-egg special animations** — Konami rapid-shuffle (PR #35) and ID captions (PR #51) done. Full special-animations-per-ID still open as a stretch.
- [ ] **Pixel-by-pixel materialize animation** — first-paint progressively reveals the character (simple creator fade shipped in PR #43; full materialize still open)

### Done
- [x] **Active nav state** — header highlights current page
- [x] **Keyboard shortcuts** — space to shuffle, P to play, arrows to cycle parts
- [x] **Share URL** — `pixabots.com/?id=2156` opens a specific combo, URL syncs live

## Ideas

- [ ] More parts — new variations for each category. Append-only to keep IDs stable.
- [ ] Accessories — new category layer (hats, items, etc.)
- [ ] Animation variants — wave, jump, spin, etc. (infra shipped via multi-frame sprites; still needs artwork + scheduled `FRAME_INDICES`)
- [ ] Social cards — `GET /api/pixabot/{id}/og` for Open Graph images with name/title
- [ ] Rate limiting — protect the API from abuse (especially animated endpoint)
- [ ] Analytics — track which pixabots are most popular, API usage stats
