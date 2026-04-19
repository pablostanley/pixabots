import { isValidId } from "@pixabots/core";

/**
 * Parse a comma-separated id string into a trimmed, lowercased, valid-filtered
 * list. Invalid entries are dropped silently. Pass `max` to clamp length.
 *
 * Returns an empty array for nullish / empty input.
 */
export function parseIdsCsv(raw: string | null | undefined, max?: number): string[] {
  if (!raw) return [];
  const out = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => isValidId(s));
  return typeof max === "number" ? out.slice(0, max) : out;
}
