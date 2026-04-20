# Pixabots

Pixel character creator and avatar API. 10,752 unique combinations from 4 categories of 32x32 sprites.

## Checklists

**After every change, check if any of these need updating:**

- `ROADMAP.md` — move items between sections, add new ideas
- `app/content/docs/` — update docs if API params, SDK functions, or parts changed
- `app/public/openapi.json` — update if API endpoints or params changed
- `@pixabots/core` on npm — bump version + republish if `packages/core/` changed
- `app/AGENTS.md` — update if conventions changed

## Monorepo structure

```
pixabots/
  app/              — Next.js app (creator UI + API routes)
  packages/core/    — @pixabots/core (published to npm as v0.1.0)
  art/png/          — source sprites (32x32 PNGs)
  marketing/        — grid images for marketing
  ROADMAP.md        — project roadmap (Ideas / Polish / Up Next / Done)
```

## Key conventions

- **Font**: Pixelify Sans (Google Fonts via `next/font/google`), all weights 400-700
- **Icons**: pixelarticons SVGs inlined in `PixelIcon` component (`app/src/components/ui/pixel-icon.tsx`). Add new icons by copying SVG path data into that file. Do NOT use @phosphor-icons/react (removed).
- **Pixel art**: never antialiased — `imageSmoothingEnabled = false` on canvas, `image-rendering: pixelated` in CSS, Sharp `kernel: nearest`
- **Parts arrays are APPEND-ONLY** — never reorder or remove entries. This keeps existing IDs stable forever.
- **ID system**: 4-char base36 string, one char per category (eyes, heads, body, top). Deterministic, reversible, no database.
- **Animation**: 16-tick super-loop (`LOOP_LENGTH`). 8-frame idle bounce (`ANIM_FRAMES`) runs twice inside it to give blink schedules room to breathe. 72ms/tick. All schedule data lives in `packages/core/src/animation.ts` — always import from there, never duplicate.
- **Sub-animations**: per-part `kind: 'static' | 'blink' | 'sequence'` on `PartOption` decides how sprite-sheet frames cycle. `resolveFrameIndex(part, tick)` in core is the one source that maps tick → frame. Never hand-roll the schedule.
- **Shared API helpers**: CORS headers, OPTIONS handler, `imageResponse()`, `DETERMINISTIC_CACHE`, and `isSameOrigin()` all live in `app/src/lib/api.ts` + `app/src/lib/rate-limit.ts`.
- **Total combos**: import `TOTAL_COMBOS` / `TOTAL_COMBOS_LABEL` from `@/lib/constants` in code. Never hardcode the number. Static files (MDX, JSON, Markdown) hardcode it but `pnpm check-combo-count` (also a CI step) fails PRs that drift.
- **Keyboard handlers**: always guard with `hasModifier(e)` from `@/lib/use-keydown`. Without it, ⌘R / ⌘D / ⌘F etc. fire the matching single-letter shortcut before the browser reload/bookmark, corrupting URL state mid-navigation.

## npm packages

`@pixabots/core`, `@pixabots/react`, and `pixabots` (CLI) all publish to npm. **Publishing is automated** via `.github/workflows/publish-{core,react,cli}.yml` — the agent can release new versions end-to-end by pushing a git tag. No local `npm login` / `npm publish` needed; the `NPM_TOKEN` lives only in the GitHub repo secret.

Release flow (per package):
1. Bump `version` in the package's `package.json`.
2. Commit + push to main (via PR).
3. `git tag {pkg}-v<new-version> && git push origin {pkg}-v<new-version>` — where `{pkg}` is `core`, `react`, or `cli`.
4. Workflow builds, runs smoke tests (core only), and publishes.

Monitor with `gh run list --workflow=publish-{core,react,cli}.yml`.

The `pixabots` CLI required a one-time manual `npm publish` from a human's machine (granular tokens can't create unscoped packages). Once live on npm, the token's allow-list was extended to include `pixabots`, so every subsequent `cli-v*` tag publishes via the workflow.

designteam.app currently inlines `randomPixabotId()` — should swap for `@pixabots/core`'s `randomId()` now that it's on npm.

## Adding new parts

### Static parts (single 32×32 PNG)

1. Drop the PNG in `art/png/{category}/{name}.png`.
2. Run `node scripts/stitch-frames.mjs` — copies flat PNGs through to `app/public/parts/{category}/{name}.png`.
3. **Append** the name to the array in `packages/core/src/parts.ts` (never reorder!).
4. Update the hardcoded combo count in MDX / README / openapi.json (everything else auto-updates). `pnpm check-combo-count` tells you which files disagree.
5. Rebuild: `pnpm --filter @pixabots/core build`.
6. Bump `packages/core/package.json` minor, push `core-v<new>` tag — the publish workflow ships to npm. (Bump `@pixabots/react` minor + tag too if consumers need the new PartOption.)

### Animated parts (sub-animations)

A part animates by shipping multiple frames in a subdirectory under `art/png/{category}/{name}/`. The stitcher detects two layouts automatically:

- **Blink** — two files: `{name}-open.png` + `{name}-closed.png`. Stitches to a 2-frame sheet ordered `[open, closed]`. Runtime schedule (from `BLINK_SCHEDULE`): open-closed-open-closed-hold-open — two fast blinks then 8 ticks held open inside the 16-tick super-loop.
- **Sequence** — numbered files: `{name}-01.png` … `{name}-NN.png`. Stitches to an N-frame sheet played in order. N should divide `LOOP_LENGTH` (1 / 2 / 4 / 8 / 16) so the sub-loop fits evenly — the stitcher doesn't enforce this, but mismatched N will visibly drift against the bounce.

Workflow:

1. Draw the frames into the subdirectory using the naming rules above.
2. Run `node scripts/stitch-frames.mjs`.
3. In `packages/core/src/parts.ts`, change the part from `'name'` to `{ name: 'name', frames: N, kind: 'blink' | 'sequence' }`.
4. Rebuild core, ship via tag.

If animation data itself changes (schedule, frame count, `ANIM_FRAMES`, etc.) rather than just art, also bump `ANIM_VERSION` in `packages/core/src/animation.ts` so CDN-cached URLs break cleanly.

Body sub-animations aren't wired yet (the feet-planted split in the server renderer still uses the frame-0 top/bottom split); eyes/heads/top are wired end-to-end.

## API

- `GET /api/pixabot/{id}` — PNG image. `?size=<any integer 32–1920>`, `?format=json|svg`, `?animated=true` for GIF, `?webp=true` with `animated=true` for animated WebP, `?speed=0.25–4`, `?hue=0–359`, `?saturate=0–4`, `?bg=%23rrggbb`, `?v=N` cache-bust.
- `GET /api/pixabot/{id}/frames` — JSON timeline of the idle loop: per-tick layer offsets + sprite-sheet indices, per-layer sprite URLs, `animVersion`, `frameMs`, `loopLength`. Consumers that want client-side playback (canvas, CSS sprite) use this to dodge the animated-render rate limit.
- `GET /api/pixabot/random` — 302 redirect to random pixabot (or `?format=json`). Forwards `size`, `animated`, `speed`, `webp`, `hue`, `saturate`, `bg`.
- `GET /api/pixabot/batch?ids=a,b,…` or `?count=N` — up to 100 pixabots as JSON; forwards palette + bg into returned png/gif URLs.
- JSON responses include `png` and `gif` URLs.
- OpenAPI 3.1 spec at `/openapi.json`.
- CORS enabled. 1-day fresh + 7-day stale-while-revalidate on deterministic endpoints (`DETERMINISTIC_CACHE` in `app/src/lib/api.ts`). Same-origin requests bypass rate limits via `isSameOrigin()` (checks `Sec-Fetch-Site: same-origin`) — external consumers capped at 120 animated/min + 60 OG/min per IP per lambda.

## Deployment

- Vercel, root directory is `.` (project root)
- `vercel.json` handles pnpm monorepo build: builds @pixabots/core first, then the Next.js app in `app/`
- `packageManager: pnpm@9.0.6` in root package.json
- Vercel project: `app` under pablostanley's team

## Related projects

- **designteam.app** (`/Users/pablostanley/Dropbox/designteam`, repo: pablostanley/designteam-app) — first consumer of the Pixabots API. Agents get `pixabotId` field, avatars render via `https://pixabots.com/api/pixabot/{id}?size=240`. PR #3 has the integration.
