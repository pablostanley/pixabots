/**
 * Pixabots Bounce Animation
 *
 * 8-frame idle bounce. Each frame defines Y-offsets (in native pixels)
 * for each layer. At 72ms per frame this gives a ~14fps bounce.
 */

import type { PartOption } from './parts'

/**
 * Animation output version. Bump on any change that alters rendered
 * animated frames (ANIM_FRAMES, FRAME_MS, LOOP_LENGTH, BLINK_SCHEDULE,
 * resolveFrameIndex, or the per-frame compositing pipeline on the API).
 *
 * Used as a cache-busting query param (`?v=N`) on `/api/pixabot/{id}`
 * so consumers who upgrade `@pixabots/core` or `@pixabots/react`
 * automatically fetch the updated render instead of the CDN's
 * immutable-cached copy.
 *
 * Sprite-PNG changes are a separate concern — they affect static PNG
 * output too and require a Vercel CDN purge on deploy, not a version
 * bump here.
 */
export const ANIM_VERSION = 1

export interface AnimFrame {
  top: number
  heads: number
  eyes: number
  body: number
}

/** Frame duration in milliseconds */
export const FRAME_MS = 72

/** 8-frame bounce animation. Values are Y-offsets in native pixels. */
export const ANIM_FRAMES: AnimFrame[] = [
  { top: 0, heads: 0, eyes: 0, body: 0 },
  { top: 0, heads: 0, eyes: 0, body: 0 },
  { top: 0, heads: 1, eyes: 1, body: 0 },
  { top: 1, heads: 2, eyes: 2, body: 1 },
  { top: 2, heads: 2, eyes: 2, body: 1 },
  { top: 2.5, heads: 2, eyes: 2, body: 1 },
  { top: 2, heads: 1, eyes: 1, body: 1 },
  { top: 1, heads: 0, eyes: 0, body: 0 },
]

/**
 * Total length of the idle loop in ticks. The bounce (`ANIM_FRAMES`) is
 * 8 ticks and repeats twice inside this 16-tick super-loop so the blink
 * schedule has room to breathe — two quick blinks followed by a long
 * eyes-open hold. Sequence sub-animations also loop inside this length.
 *
 * LOOP_LENGTH must be a multiple of ANIM_FRAMES.length and of every
 * sequence part's `frames` (1 / 2 / 4 / 8 / 16 are all valid).
 */
export const LOOP_LENGTH = 16

/**
 * 16-tick schedule for blink parts against a 2-frame sheet [open, closed]:
 * two fast blinks in the first 8 ticks, then 8 ticks held open. Felt too
 * twitchy at the previous 8-tick cadence.
 */
export const BLINK_SCHEDULE: readonly number[] = [
  0, 1, 0, 1, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
]

/**
 * Which frame index of a part's sprite sheet to show on a given tick of
 * the 16-tick super-loop. Driven by the part's `kind`:
 *
 * - 'static' (or frames ≤ 1): always frame 0.
 * - 'blink':                   BLINK_SCHEDULE[tick].
 * - 'sequence':                tick % frames — loops inside the super-loop.
 *
 * Runtime still clamps to the part's available frame count, so mismatches
 * (e.g. kind='sequence' with frames=3) fall back gracefully rather than
 * overrun the sheet.
 */
export function resolveFrameIndex(part: PartOption, tick: number): number {
  const frames = part.frames ?? 1
  if (frames <= 1) return 0
  const kind = part.kind ?? 'static'
  if (kind === 'blink') return BLINK_SCHEDULE[tick % BLINK_SCHEDULE.length]
  if (kind === 'sequence') return tick % frames
  return 0
}
