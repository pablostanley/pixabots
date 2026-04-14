/**
 * Pixabots ID System
 *
 * Each pixabot combo is encoded as a 4-character base36 string.
 * One character per category (eyes, heads, body, top), in that order.
 *
 * Example: eyes=2, heads=1, body=5, top=6 → "2156"
 * Example: eyes=15, heads=7, body=6, top=10 → "f76a"
 *
 * Supports up to 36 parts per category (0-9, a-z).
 * Arrays are append-only so old IDs stay stable forever.
 */

import { CATEGORY_ORDER, PARTS, type PartCategory } from './parts.js'

export interface PixabotCombo {
  eyes: number
  heads: number
  body: number
  top: number
}

/** Encode a combo of part indices into a 4-char base36 ID */
export function encode(combo: PixabotCombo): string {
  let id = ''
  for (const cat of CATEGORY_ORDER) {
    const index = combo[cat]
    const max = PARTS[cat].length
    if (index < 0 || index >= max) {
      throw new RangeError(`Index ${index} out of range for "${cat}" (0–${max - 1})`)
    }
    id += index.toString(36)
  }
  return id
}

/** Decode a 4-char base36 ID into part indices */
export function decode(id: string): PixabotCombo {
  if (!isValidId(id)) {
    throw new Error(`Invalid pixabot ID: "${id}"`)
  }
  const combo = {} as PixabotCombo
  for (let i = 0; i < CATEGORY_ORDER.length; i++) {
    const cat = CATEGORY_ORDER[i]
    combo[cat] = parseInt(id[i], 36)
  }
  return combo
}

/** Validate an ID string without throwing */
export function isValidId(id: string): boolean {
  if (typeof id !== 'string' || id.length !== CATEGORY_ORDER.length) return false
  for (let i = 0; i < CATEGORY_ORDER.length; i++) {
    const cat = CATEGORY_ORDER[i]
    const val = parseInt(id[i], 36)
    if (isNaN(val) || val < 0 || val >= PARTS[cat].length) return false
  }
  return true
}

/** Resolve a combo to its named parts */
export function resolve(combo: PixabotCombo): Record<PartCategory, string> {
  const result = {} as Record<PartCategory, string>
  for (const cat of CATEGORY_ORDER) {
    result[cat] = PARTS[cat][combo[cat]].name
  }
  return result
}

/** Resolve an ID directly to named parts */
export function resolveId(id: string): Record<PartCategory, string> {
  return resolve(decode(id))
}
