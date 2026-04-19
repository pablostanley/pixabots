/**
 * Pixabots Parts Catalog
 *
 * IMPORTANT: Arrays are APPEND-ONLY. Never reorder or remove entries.
 * New parts must be added to the END of their category array.
 * This ensures existing IDs remain stable forever.
 */

export type PartCategory = 'eyes' | 'heads' | 'body' | 'top'

/**
 * Per-part sub-animation kind. Selects which frame to show on each tick
 * of the 8-frame idle bounce.
 *
 * - `static`:   always frame 0. Default when `frames` is 1 or omitted.
 * - `blink`:    2-frame sprite sheet ordered [open, closed]. Tick schedule
 *               `[0,1,0,1,0,0,0,0]` — two blinks then hold-open.
 * - `sequence`: N-frame sheet played in order. Advances one frame per tick
 *               and loops to fit the 8-tick bounce (N should divide 8: 1/2/4/8).
 *
 * Add new kinds here as new named patterns become useful.
 */
export type PartAnimKind = 'static' | 'blink' | 'sequence'

export interface PartOption {
  name: string
  /** Canonical path segment: "{category}/{name}.png" */
  path: string
  /**
   * Number of horizontal frames in the sprite sheet (sheet width = frames × 32).
   * Defaults to 1 (single 32×32 sprite). For blink: 2. For sequence: N where
   * N ∈ {1, 2, 4, 8} so it fits the 8-tick canonical bounce loop.
   */
  frames?: number
  /** Sub-animation kind (see PartAnimKind). Defaults to 'static'. */
  kind?: PartAnimKind
}

/** Layer compositing order (bottom to top): top, body, heads, eyes */
export const LAYER_ORDER: PartCategory[] = ['top', 'body', 'heads', 'eyes']

/** Category encoding order — fixed, used for ID encoding */
export const CATEGORY_ORDER: PartCategory[] = ['eyes', 'heads', 'body', 'top']

type PartInput = string | { name: string; frames?: number; kind?: PartAnimKind }

function makeParts(category: PartCategory, entries: PartInput[]): PartOption[] {
  return entries.map(entry => {
    const e = typeof entry === 'string' ? { name: entry } : entry
    return {
      name: e.name,
      path: `${category}/${e.name}.png`,
      ...(e.frames && e.frames > 1 ? { frames: e.frames } : {}),
      ...(e.kind && e.kind !== 'static' ? { kind: e.kind } : {}),
    }
  })
}

export const PARTS: Record<PartCategory, PartOption[]> = {
  eyes: makeParts('eyes', [
    'big-face',
    'cheeky-terminal',
    'glasses',
    { name: 'human', frames: 2, kind: 'blink' },
    { name: 'human-2', frames: 2, kind: 'blink' },
    'monitor',
    'monitor-round',
    'mustache',
    { name: 'terminal', frames: 2, kind: 'blink' },
    { name: 'terminal-green', frames: 2, kind: 'blink' },
    'terminal-light',
    'terminal-round',
    { name: 'tight-visor', frames: 8, kind: 'sequence' },
    { name: 'visor', frames: 8, kind: 'sequence' },
    { name: 'wayfarer', frames: 4, kind: 'sequence' },
    { name: 'wayfarer-face', frames: 8, kind: 'sequence' },
  ]),
  heads: makeParts('heads', [
    'ac',
    'blob',
    'blob-blue',
    'bowl',
    'box',
    'commodore',
    'frame',
    'punch-bowl',
  ]),
  body: makeParts('body', [
    'backpack',
    'claws',
    'heart',
    'swag',
    'tank',
    'wings',
    'fire',
  ]),
  top: makeParts('top', [
    'antenna',
    'bulb',
    'bunny-ears',
    'disco',
    'leaf',
    'lollypop',
    'mohawk',
    'plant',
    'radar',
    'bun',
    'horns',
  ]),
}

/** Get the number of options for a category */
export function partCount(category: PartCategory): number {
  return PARTS[category].length
}

/** Get a single part by category + index */
export function getPart(category: PartCategory, index: number): PartOption {
  const options = PARTS[category]
  if (index < 0 || index >= options.length) {
    throw new RangeError(`Index ${index} out of range for category "${category}" (0–${options.length - 1})`)
  }
  return options[index]
}

/** Look up a part index by name. Returns -1 if not found. */
export function getPartIndex(category: PartCategory, name: string): number {
  return PARTS[category].findIndex(p => p.name === name)
}

/** Total number of unique combinations */
export function totalCombinations(): number {
  return CATEGORY_ORDER.reduce((acc, cat) => acc * PARTS[cat].length, 1)
}
