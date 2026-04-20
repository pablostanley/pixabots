#!/usr/bin/env node
/**
 * Fails if any hardcoded combo count in the docs / READMEs / openapi.json
 * disagrees with `totalCombinations()` from `@pixabots/core`.
 *
 * Rationale: code paths single-source the number via `TOTAL_COMBOS_LABEL`
 * in `app/src/lib/constants.ts`. Static files (MDX prose, JSON, Markdown)
 * can't import at render time and have to be updated manually when parts
 * are added. This check catches the mismatch in CI before it ships.
 *
 * Usage: `node scripts/check-combo-count.mjs`
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
// scripts/ isn't a workspace member, so import the built core directly.
import { totalCombinations } from "../packages/core/dist/index.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

// Files known to hardcode the total. Add new paths here when docs grow.
const FILES = [
  "CLAUDE.md",
  "app/README.md",
  "app/public/openapi.json",
  "app/content/docs/index.mdx",
  "app/content/docs/sdk.mdx",
  "app/content/docs/shortcuts.mdx",
];

// Matches any 4–5 digit number with comma separators or a bare 4–5 digit
// integer that sits next to the word "combos" / "combinations" / "characters"
// / "pixabots" / "combo space". Narrow enough to skip unrelated numbers.
const PATTERNS = [
  /(\d{1,3}(?:,\d{3})+)(?=\s*(?:combos?|combinations?|unique|combo\s+space|characters))/gi,
  /(?<![0-9])(\d{4,5})(?=\s*(?:combos?|combinations?|unique|combo\s+space|characters))/gi,
  // "totalCombinations();  // N"
  /totalCombinations\([^)]*\);\s*\/\/\s*(\d+)/g,
];

async function main() {
  const expected = totalCombinations();
  const expectedLabel = expected.toLocaleString("en-US");
  let mismatched = 0;

  for (const rel of FILES) {
    const abs = path.join(ROOT, rel);
    const src = await readFile(abs, "utf8");
    for (const re of PATTERNS) {
      for (const match of src.matchAll(re)) {
        const raw = match[1];
        const n = Number(raw.replace(/,/g, ""));
        if (n === expected) continue;
        // Ignore numbers under 100 or unrelated multi-digit values that
        // happened to neighbor one of the trigger words.
        if (n < 1000) continue;
        console.error(
          `✗ ${rel}: found "${raw}" but expected "${expectedLabel}" (${expected})`
        );
        mismatched++;
      }
    }
  }

  if (mismatched > 0) {
    console.error(
      `\n${mismatched} mismatch${mismatched === 1 ? "" : "es"}. ` +
        `Update static files to "${expectedLabel}" (or bump this script's FILES list).`
    );
    process.exit(1);
  }
  console.log(`✓ All ${FILES.length} static files match totalCombinations() = ${expectedLabel}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
