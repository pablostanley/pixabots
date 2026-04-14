/**
 * Pixabots Parts Catalog
 *
 * IMPORTANT: Arrays are APPEND-ONLY. Never reorder or remove entries.
 * New parts must be added to the END of their category array.
 * This ensures existing IDs remain stable forever.
 */

export type PartCategory = 'eyes' | 'heads' | 'body' | 'top'

export interface PartOption {
  name: string
  /** Canonical path segment: "{category}/{name}.png" */
  path: string
}

/** Layer compositing order (bottom to top): top, body, heads, eyes */
export const LAYER_ORDER: PartCategory[] = ['top', 'body', 'heads', 'eyes']

/** Category encoding order — fixed, used for ID encoding */
export const CATEGORY_ORDER: PartCategory[] = ['eyes', 'heads', 'body', 'top']

function makeParts(category: PartCategory, names: string[]): PartOption[] {
  return names.map(name => ({ name, path: `${category}/${name}.png` }))
}

export const PARTS: Record<PartCategory, PartOption[]> = {
  eyes: makeParts('eyes', [
    'big-face',
    'cheeky-terminal',
    'glasses',
    'human',
    'human-2',
    'monitor',
    'monitor-round',
    'mustache',
    'terminal',
    'terminal-green',
    'terminal-light',
    'terminal-round',
    'tight-visor',
    'visor',
    'wayfarer',
    'wayfarer-face',
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
