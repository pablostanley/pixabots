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

### 13. Expanded keyboard shortcuts + help overlay
Keep existing (space=shuffle, p=play/pause, arrows=cycle layers). Add: `c`=copy URL, `d`=download menu, `?`=open shortcut-help overlay, `/`=focus command palette. All skip when typing in inputs.
- **Acceptance:** `?` shows a modal listing every shortcut; `c` copies from anywhere in the creator; existing shortcuts unchanged

### 16. SiteHeader theme detection via useEffect (follow-up from #3)
`SiteHeader` reads `prefers-color-scheme` inside a `useEffect`. Swap to useSyncExternalStore reading `matchMedia`, or pre-hydration inline script that sets `documentElement.classList` before React mounts — avoids flash and complies with "no useEffect" rule.
- **Acceptance:** theme set before first paint; matches `prefers-color-scheme` reactively; toggle button still works

### 15. Drag-to-dismiss on mobile bottom sheet (descoped from #2)
Add touch-drag gesture to dismiss the mobile sheet. Either bring in `vaul` (shadcn's recommended drawer) or wire up `pointerdown`/`pointermove`/`pointerup` manually with a translate + velocity check.
- **Acceptance:** swipe-down on the sheet closes it with momentum; threshold feels natural (≥80px or >0.5 velocity); doesn't conflict with internal scroll

### 14. Command palette (⌘K)
Floating input triggered by ⌘K / Ctrl+K. Fuzzy-search actions:
- **Navigation:** Go Home / Go to Browse / Go to Docs / Random
- **Jump by ID:** type a 4-char ID → Enter → `/bot/{id}`
- **Jump by part:** type `glasses` → sets creator face to glasses (home only)
- **Actions (context-aware):** Copy URL, Download PNG, Download GIF, Play/Stop animation, Share
- Keyboard-driven; arrows navigate options; Enter runs; ESC closes.
- **Acceptance:** ⌘K works on every page; part-name search filters actions; ID input validates (invalid → inline error)

## Polish

### UI
- [ ] **Background color picker** — transparent by default, but let users pick a color for exports
- [ ] **Custom pixel tooltips** — replace native browser tooltips with styled ones using our pixel font
- [ ] **Loading state** — skeleton/shimmer on creator canvas and browse grid while first images load
- [ ] **Lock layers** — lock icon per category so shuffle keeps locked layers fixed (shuffle "eyes only", etc.)
- [ ] **Animated part transitions** — smooth fade/slide between parts instead of instant swap
- [ ] **Mobile bottom sheet** — use a bottom sheet instead of centered dialog on mobile for bot detail
- [ ] **Sticky header with scroll behavior** — hide on scroll down, reveal on scroll up; backdrop blur
- [ ] **Focus rings everywhere** — audit all interactive elements for visible keyboard focus
- [ ] **Favorite / pin pixabots** — star icon persists IDs in localStorage, "Favorites" tab in browse
- [ ] **"You might also like"** — on bot page, show 4 one-part-different variants
- [ ] **Compare view** — side-by-side two pixabots at `?compare=2156,f76a`
- [ ] **Gallery mode** — fullscreen single-bot view with background color options, big animation
- [ ] **Embed code on bot page** — tabbed snippet generator: HTML / Markdown / React / URL

### Speed & perf
- [ ] **Prefetch bot detail on browse hover** — Next.js `<Link prefetch>` already partial; extend to PNG preload
- [ ] **Preload sprite parts on creator mount** — 42 tiny PNGs fetched in parallel so first shuffle is instant
- [ ] **Next shuffle preloaded** — generate+preload the next random ID behind the scenes; shuffle becomes 0ms
- [ ] **Palette-optimized GIFs** — Sharp `gif({ effort })` / reduced colors for smaller files on the wire
- [ ] **WebP animated output** — smaller than GIF with alpha support (see Ideas)
- [ ] **Service worker** — cache API responses and parts for repeat visits / offline
- [ ] **PWA manifest** — installable as an app, home-screen icon, standalone display

### Messaging & copy
- [ ] **Personality in empty states / 404** — "this pixabot got lost" + random pixabot on 404 page
- [ ] **First-shuffle hint** — tiny coachmark on first visit: "press SPACE to shuffle"
- [ ] **Copy-button state polish** — animated check that fades back to copy icon, accompanied by "Copied URL"
- [ ] **Error messages match voice** — API 400s stay plain, but UI error states use the pixel vibe
- [ ] **Share via Web Share API on mobile** — native share sheet instead of copy-URL-only
- [ ] **Discovery copy** — on homepage subtly note "9,856 combos — press SPACE to keep going"

### Accessibility & comfort
- [ ] **`prefers-reduced-motion` support** — freeze idle bounce, disable hover "speed up" on browse
- [ ] **Screen-reader announcements on shuffle** — `aria-live` region announces the new ID
- [ ] **High-contrast focus + checkered BG** — audit dark mode for AA contrast on all text
- [ ] **Command palette (⌘K)** — quick jump to ID, Browse, Docs, Random; monospace-style UI matches vibe

### Delight
- [ ] **Easter-egg IDs** — specific IDs trigger special animations (Konami → rapid shuffle, `pxlb` → author credit)
- [ ] **Drop-shadow / parallax tilt on hover** — subtle hover depth on bot detail page
- [ ] **Random boot-up animation** — first-paint shows the character "materializing" pixel-by-pixel
- [ ] **Opt-in 8-bit sound effects** — chiptune blip on shuffle/copy, toggled off by default

### Done
- [x] **Active nav state** — header highlights current page
- [x] **Keyboard shortcuts** — space to shuffle, P to play, arrows to cycle parts
- [x] **Share URL** — `pixabots.com/?id=2156` opens a specific combo, URL syncs live

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
- [ ] Embed widget — `<script>` tag or iframe for embedding a pixabot in any site
- [ ] Browse filters — filter by part (e.g., all bots with glasses)
- [ ] GitHub avatar integration — use as profile pic via URL
- [ ] Rate limiting — protect the API from abuse (especially animated endpoint)
- [ ] Analytics — track which pixabots are most popular, API usage stats
