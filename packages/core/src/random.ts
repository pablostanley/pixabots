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
 *
 * Exported so app-side code that needs deterministic seeds (e.g. picking
 * "you might also like" variants from an id) can use the same primitive
 * the library uses internally.
 */
export function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

/**
 * Mulberry32 PRNG. Given a 32-bit integer seed, returns a function that
 * yields a new float in [0, 1) on each call. Small, fast, deterministic.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Convenience: hash a string seed and return a mulberry32 generator.
 * Same string always yields the same sequence.
 */
export function createRng(seed: string): () => number {
  return mulberry32(hashString(seed))
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
