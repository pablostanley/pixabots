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

## Up Next

Prioritized tickets to work through. Each is self-contained and shippable.

### 1. Prev / next navigation in browse dialog — **in review ([PR #14](https://github.com/pablostanley/pixabots/pull/14))**
When the bot dialog is open on `/browse`, left/right arrow keys (and visible `<` `>` buttons) move to the prev/next bot in the current grid order. URL updates to the new `/bot/{id}`.
- **Acceptance:** arrow keys + on-screen buttons navigate; ESC still dismisses back to grid; deep-linking `/bot/{id}` directly (full page) unaffected
- **Scope change:** implemented on shared `BotDetail`, so it also covers the Polish "Prev / next on bot page" item for free
- **Approach:** combo-index linearization walks all 9,856 bots in stable order, wraps at boundaries. `router.replace` keeps back button returning to `/browse`.

### 2. Mobile bottom sheet for bot detail
Below the `sm` breakpoint, render the dialog as a bottom sheet that slides up from the edge and can be drag-dismissed. Desktop keeps the centered dialog.
- **Acceptance:** touch targets ≥ 44px; slide is 60fps; dismissible via drag, ESC, and outside tap; scroll inside sheet when content taller than viewport

### 3. Sticky header with scroll behavior
Header stays pinned; hides on scroll down, reveals on scroll up; backdrop blur kicks in past 20px of scroll. Applies to home and `/browse` (docs keeps Fumadocs default).
- **Acceptance:** no layout jank; motion respects `prefers-reduced-motion`; never covers the canvas on home

### 4. Prefetch bot PNG on browse card hover
On `mouseenter` of a browse card, kick off a fetch for the detail-size PNG so clicking feels instant. Route prefetch already handled by `<Link>`.
- **Acceptance:** hovered → clicked card shows image immediately (no network wait); non-hovered path unchanged

### 5. Preload sprite parts on creator mount
On creator mount, fire parallel `fetch` for all 42 sprite PNGs (`/parts/**/*.png`). Browser cache means every subsequent shuffle draws without network. Same sprites serve browse, bot pages, OG images — cache is hot across the site.
- **Acceptance:** DevTools Network shows no sprite requests on 2nd+ shuffle; first meaningful paint not regressed

### 6. 404 page with lost pixabot
Create `app/not-found.tsx` with a random animated pixabot, personality copy ("this pixabot got lost"), and links to Home + Browse. Caught by invalid `/bot/{id}` too.
- **Acceptance:** visiting any unknown route renders the 404; `/bot/zzzz` also renders it; pixabot animates

### 7. Animated copy-button feedback
Copy button currently swaps icon `copy` → `check`. Upgrade: scale-pop + "Copied!" label that lingers ~1.5s, then fades back. No layout shift.
- **Acceptance:** click copy → visible confirmation; reusable across home + browse + bot pages

### 8. Web Share API on mobile
On touch devices, "Share" button calls `navigator.share({ url, title, text })`. Fallback to existing clipboard copy when unavailable (desktop, or API missing).
- **Acceptance:** iOS/Android opens native share sheet; desktop/unsupported copies URL

### 9. a11y — `prefers-reduced-motion`
Respect `@media (prefers-reduced-motion: reduce)` everywhere: freeze idle bounce in creator, disable 2x-speed-on-hover in browse, cut dialog + sticky-header transitions. Pause GIFs: serve static PNG instead of animated.
- **Acceptance:** toggle OS setting → all animation halts; static frames display; no CLS

### 10. a11y — aria-live shuffle announcement
Visually-hidden `aria-live="polite"` region announces the new ID after each shuffle ("Pixabot 2156, glasses blob wings mohawk"). Fires on both creator and browse-hover.
- **Acceptance:** VoiceOver/NVDA speaks the new ID within ~1s of shuffle

### 11. a11y — focus ring audit
Every interactive element (buttons, links, cards, dialog close, dropdown triggers) has a visible keyboard-only focus ring at AA contrast in both themes.
- **Acceptance:** tab through entire site — every focused element clearly indicated; no `:focus { outline: none }` without replacement

### 12. a11y — dark mode contrast audit
Run WCAG AA check on all text/background pairs in dark mode. `muted-foreground` against `background` is the likely weak spot.
- **Acceptance:** all body text ≥ 4.5:1, all large text ≥ 3:1; fixes shipped as theme-variable tweaks (not per-component)

### 13. Expanded keyboard shortcuts + help overlay
Keep existing (space=shuffle, p=play/pause, arrows=cycle layers). Add: `c`=copy URL, `d`=download menu, `?`=open shortcut-help overlay, `/`=focus command palette. All skip when typing in inputs.
- **Acceptance:** `?` shows a modal listing every shortcut; `c` copies from anywhere in the creator; existing shortcuts unchanged

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
- [ ] **Prev / next on bot page** — arrows to walk neighbor IDs (`/bot/2155` → `/bot/2156` → `/bot/2157`)
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
