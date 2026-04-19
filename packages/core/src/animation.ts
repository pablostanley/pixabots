/**
 * Pixabots Bounce Animation
 *
 * 8-frame idle bounce. Each frame defines Y-offsets (in native pixels)
 * for each layer. At 72ms per frame this gives a ~14fps bounce.
 */

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
 * Per-tick sprite-sheet frame index for each category.
 *
 * Each array has the same length as ANIM_FRAMES (one entry per tick) and
 * contains the frame index to sample from the sprite sheet. For sprites
 * drawn as a single 32×32 image (the default today), always 0.
 *
 * Authors adding multi-frame sprites (e.g. a blink for an eye variant)
 * should tweak FRAME_INDICES[category] to sequence the extra frames.
 * Runtime clamps the lookup against each part's `frames` count, so a
 * category's sequence can reference frame N without forcing every part
 * in that category to provide N frames — parts with fewer frames fall
 * back to frame 0.
 */
export const FRAME_INDICES: { top: number[]; heads: number[]; body: number[]; eyes: number[] } = {
  top: [0, 0, 0, 0, 0, 0, 0, 0],
  heads: [0, 0, 0, 0, 0, 0, 0, 0],
  body: [0, 0, 0, 0, 0, 0, 0, 0],
  eyes: [0, 0, 0, 0, 0, 0, 0, 0],
}
