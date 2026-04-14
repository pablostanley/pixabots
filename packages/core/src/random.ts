/**
 * Pixabots Random Generation
 */

import { CATEGORY_ORDER, PARTS } from './parts.js'
import { encode, type PixabotCombo } from './id.js'

/** Generate a random combo */
export function randomCombo(): PixabotCombo {
  const combo = {} as PixabotCombo
  for (const cat of CATEGORY_ORDER) {
    combo[cat] = Math.floor(Math.random() * PARTS[cat].length)
  }
  return combo
}

/** Generate a random pixabot ID */
export function randomId(): string {
  return encode(randomCombo())
}

/**
 * Simple string hash (djb2 variant).
 * Returns a positive 32-bit integer.
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

/**
 * Generate a deterministic combo from a seed string.
 * Same seed always produces the same pixabot.
 * Useful for: agent IDs, email addresses, usernames.
 */
export function seededCombo(seed: string): PixabotCombo {
  const h = hashString(seed)
  const combo = {} as PixabotCombo
  let remaining = h
  for (const cat of CATEGORY_ORDER) {
    const count = PARTS[cat].length
    combo[cat] = remaining % count
    remaining = Math.floor(remaining / count)
  }
  return combo
}

/** Generate a deterministic pixabot ID from a seed string */
export function seededId(seed: string): string {
  return encode(seededCombo(seed))
}
