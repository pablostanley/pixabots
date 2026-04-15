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
