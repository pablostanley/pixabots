# Improve GIFs / Animated API

Tracking ticket for fixes to the animated output of `/api/pixabot/{id}`. Spawned from an audit of consumer-facing friction (2026-04-19).

Root question driving the work: **can third parties use our animations, and will they get updates when we change them?**

- Usable: yes — CORS `*`, no auth, `?animated=true` on any size 32–1920, GIF + WebP, `hue` / `saturate` / `bg` / `speed` all apply.
- Updates propagate: **no** — `Cache-Control: public, max-age=31536000, immutable` on every deterministic URL (`app/src/lib/api.ts:20`). Change `ANIM_FRAMES` → existing URLs serve stale forever until CDN + browser caches evict.

## Status legend

- **[ ]** — not started
- **[~]** — in progress (open PR)
- **[x]** — shipped

---

## PRs in this session

### P0 — animation staleness trap `[x]` — shipped (PR #164)

**Problem.** `imageResponse()` sets 1-year immutable cache. If we ever edit `ANIM_FRAMES`, `FRAME_MS`, `FRAME_INDICES`, or sprite PNGs, existing deterministic URLs keep serving the old render until CDN entry evicts.

**Fix plan.**
1. Export `ANIM_VERSION` constant from `@pixabots/core` (`packages/core/src/animation.ts`). Start at `1`. Bump on every animation-data or sprite change.
2. Accept `?v=N` on `/api/pixabot/[id]`. Value only participates in the URL (cache key) — server ignores it for rendering. No behavior change for consumers who don't pass it.
3. `@pixabots/react` auto-appends `?v=${ANIM_VERSION}` so SDK consumers cache-bust automatically on npm upgrade.
4. Runbook: on animation change, bump `ANIM_VERSION`, bump `@pixabots/core` minor, bump `@pixabots/react` minor, republish. Optional: run Vercel CDN purge for raw-`<img>` consumers who pinned URLs without `v`.

**Files to touch.**
- `packages/core/src/animation.ts` — add `ANIM_VERSION`
- `packages/core/package.json` — bump minor
- `packages/react/` — append `v` param in helpers
- `app/src/app/api/pixabot/[id]/route.ts` — accept + echo `v` through
- `app/content/docs/api.mdx` — document `?v=N` + purge runbook
- `app/public/openapi.json` — add `v` param

**Shipped as**: PR #164. `ANIM_VERSION = 1` exported from `@pixabots/core` (bumped 0.4.0 → 0.5.0). `@pixabots/react` (0.3.0 → 0.4.0) auto-appends `v=${ANIM_VERSION}` on animated URLs. Docs + OpenAPI spec document `?v=` param and the maintainer bump runbook. Server silently accepts the unknown param — no route changes needed.

`core-v0.5.0` + `react-v0.4.0` tags pushed post-merge to trigger `publish-core.yml` + `publish-react.yml`.

---

### P3 — docs clarity on animated sizes `[x]` — shipped (PR #163)

**Problem.** `app/content/docs/api.mdx` phrases animated sizing as "Supports all sizes" (L19) and "All sizes are supported — including 1920px" (L49). Reads as if 1920 is special / the only size. Audit author (Pablo) misread this exact line.

**Fix.** Change to "Any integer 32–1920, same as PNG." Match the PNG table. One-line edit.

**Tracked in**: PR #163 — shipped. Replaced the two offending lines in `app/content/docs/api.mdx` and the `animated` param description in `app/public/openapi.json` with "any size from 32 to 1920, same as PNG."

---

### nice-to-have — `/api/pixabot/{id}/frames` endpoint `[x]` — shipped (PR #165)

**Problem.** Consumers who want scrubbable timelines, CSS `steps()` sprite animation, or autoplay control have to either (a) accept our baked GIF or (b) reverse-engineer frame timing from `@pixabots/core` source. The rate-limit (30 anim/min per IP per lambda) also hurts heavy consumers.

**Fix plan.** New `GET /api/pixabot/{id}/frames?size=N`:

```json
{
  "id": "2156",
  "frameMs": 72,
  "frames": [
    { "offsets": {"top": 0, "heads": 0, "eyes": 0, "body": 0}, "indices": {"top": 0, "heads": 0, "eyes": 0, "body": 0} },
    ...
  ],
  "sprites": {
    "top": "https://pixabots.com/api/pixabot/2156/layer/top?size=N",
    "heads": "...",
    "eyes": "...",
    "body": "..."
  },
  "animVersion": 1
}
```

Consumers render client-side with a canvas / CSS sprite sheet. No rate limit (cheap JSON, immutable cache), no staleness trap (cache-bust via `animVersion` field), full playback control.

Separately: expose per-layer sprite URLs as sub-resources, or use existing `/parts/{cat}/{name}.png` statics with resolved part names from `?format=json`.

**Files to touch.**
- `app/src/app/api/pixabot/[id]/frames/route.ts` — new
- `app/content/docs/api.mdx` — new section
- `app/public/openapi.json` — add path

**Shipped as**: PR #165. Emits 16-tick super-loop with offsets + per-layer sprite-sheet index + sprite URLs + `animVersion`. Immutably cached — same `animVersion` served for consumers' lifetime until bumped.

---

## Out of session / backlog

Discovered during audit, not shipping in this push:

- **P1 — reduced-motion on raw `<img>`.** Only `/embed/` iframe honors `prefers-reduced-motion`. Workaround: consumers use `<picture>` with `(prefers-reduced-motion: reduce)` media source and dual PNG/GIF URLs. Server-side could sniff `Sec-CH-Prefers-Reduced-Motion` header and swap to PNG, but low-priority — current docs already show the `<picture>` pattern in PR #22's shipped work.
- **P2 — rate-limit headers on every response.** `X-RateLimit-*` only emitted on 429 today. Consumers can't self-throttle without hitting limit first. Small route.ts change, worthwhile but not blocking.
- **P4 — `?paused=true`.** Returns frame-0 PNG for "hover to animate" patterns. Low priority — consumers can use `?animated=false` (the default) for frame-0 PNG already.
- **P5 — raise `/api/og` rate limit from 20 to 60/min.** Social link-preview crawlers burst-hit OG endpoints. Worth bumping once we see a spike.
- **APNG / Lottie output.** Bigger lift. Defer until a consumer asks.

---

## Notes during work

<!-- Append notes as PRs progress. Keep this section living. -->

- **2026-04-19**: ticket opened after animation-API audit. Rebased `worktree-animation-api-docs` onto `main` (picked up PR #156 sub-animations, PR #158 ⌘R fix, PR #160 SW cache bump). Sub-animations infra already uses `FRAME_INDICES` — `ANIM_VERSION` bump already implicit in the SW's `VERSION` const for service worker, but that's client-only; API cache keys still don't version.
- **2026-04-19 (EOD)**: all three in-session PRs merged end-to-end in a self-supervised loop. Publish workflows for `@pixabots/core@0.5.0` + `@pixabots/react@0.4.0` succeeded on tag push (30–34s each). `/api/pixabot/{id}/frames` live on prod via PR #165. P0, P3, frames endpoint all shipped. Backlog items (reduced-motion server hint, per-response rate-limit headers, `?paused=true`, `/api/og` limit bump, APNG/Lottie) still open — pick up next time a consumer asks or a real limit hit surfaces.
