/**
 * Shared palette helpers: swatches, hex normalization, transparent checker
 * pattern, and URL-builder for the API's `?hue` / `?saturate` params.
 *
 * All consumers of palette URLs (creator UI, bot detail, embed snippets,
 * batch responses, OG metadata, React component, CLI) should funnel through
 * `withPalette` so the query encoding stays consistent.
 */

export interface Palette {
  hue?: number;
  saturate?: number;
  bg?: string | null;
}

/** 17 background swatches (matches the Inspector swatch grid). */
export const SWATCHES: readonly string[] = [
  // Row 1 — neutrals + pastels
  "#ffffff",
  "#f5f5f4",
  "#fde68a",
  "#bbf7d0",
  "#bae6fd",
  "#fbcfe8",
  "#c4b5fd",
  "#000000",
  // Row 2 — saturated brights
  "#dc2626",
  "#ea580c",
  "#f59e0b",
  "#eab308",
  "#16a34a",
  "#14b8a6",
  "#2563eb",
  "#9333ea",
  "#db2777",
];

/** Bg choices for randomization: `null` (transparent) + the 17 swatches. */
export const BG_CHOICES: readonly (string | null)[] = [null, ...SWATCHES];

/** CSS background-image for a checker pattern, used to indicate transparency. */
export const CHECKER =
  "linear-gradient(45deg, var(--muted) 25%, transparent 25%), linear-gradient(-45deg, var(--muted) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--muted) 75%), linear-gradient(-45deg, transparent 75%, var(--muted) 75%)";

/** Returns a normalized `#rrggbb` (lowercase) or `null` for invalid input. */
export function normalizeHex(v: string): string | null {
  const raw = v.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toLowerCase()}`;
}

/** Append palette query params to a URL (defaults are omitted from the result). */
export function withPalette(url: string, p: Palette | undefined): string {
  if (!p) return url;
  const parts: string[] = [];
  if (p.hue !== undefined && p.hue !== 0) parts.push(`hue=${p.hue}`);
  if (p.saturate !== undefined && p.saturate !== 1) {
    // Trim trailing zeros so 1.5 stays "1.5" not "1.50"
    parts.push(`saturate=${Number(p.saturate.toFixed(2))}`);
  }
  if (p.bg) parts.push(`bg=${encodeURIComponent(p.bg)}`);
  if (parts.length === 0) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${parts.join("&")}`;
}
