#!/usr/bin/env node
/**
 * Stitches per-part animation frames into horizontal sprite sheets.
 *
 * Walks `art/png/{category}/{name}/` subdirectories and emits one
 * `app/public/parts/{category}/{name}.png` per animated part (sheet
 * width = frames × 32). Single-file parts (flat `art/png/{cat}/{name}.png`
 * with no subdir) are copied through unchanged.
 *
 * Two animation layouts are detected automatically:
 *
 * - **Blink** — subdir contains exactly `{name}-open.png` and
 *   `{name}-closed.png`. Output is a 2-frame sheet ordered [open, closed].
 *   Pair this with `kind: 'blink'` + `frames: 2` in `packages/core/src/parts.ts`;
 *   runtime schedules the tick pattern [0,1,0,1,0,0,0,0].
 *
 * - **Sequence** — subdir contains `{name}-NN.png` frames numbered
 *   sequentially (01, 02, …). Output is an N-frame sheet in numerical
 *   order. Pair with `kind: 'sequence'` + `frames: N`. N should divide 8
 *   (1 / 2 / 4 / 8) so the sub-loop fits the 8-tick idle bounce.
 *
 * Usage: `node scripts/stitch-frames.mjs`
 */
import { readdir, mkdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ART_ROOT = path.join(ROOT, "art/png");
const OUT_ROOT = path.join(ROOT, "app/public/parts");
const CATEGORIES = ["eyes", "heads", "body", "top"];
const FRAME_SIZE = 32;

async function isDir(p) {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Detect which frames a subdir contains. Returns an array of absolute
 * source paths ordered for the sprite sheet, or null if the layout
 * doesn't match a known pattern.
 */
async function detectFrames(dir, name) {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".png")).sort();
  if (files.length === 0) return null;

  const open = `${name}-open.png`;
  const closed = `${name}-closed.png`;
  if (files.includes(open) && files.includes(closed) && files.length === 2) {
    return { kind: "blink", frames: [open, closed].map((f) => path.join(dir, f)) };
  }

  const numbered = files.filter((f) => /-\d+\.png$/.test(f));
  if (numbered.length === files.length && numbered.length >= 2) {
    const sorted = numbered
      .map((f) => ({ f, n: Number(f.match(/-(\d+)\.png$/)[1]) }))
      .sort((a, b) => a.n - b.n)
      .map((e) => path.join(dir, e.f));
    return { kind: "sequence", frames: sorted };
  }

  return null;
}

async function stitchFrames(framePaths, outPath) {
  const n = framePaths.length;
  const composites = await Promise.all(
    framePaths.map(async (p, i) => ({
      input: await sharp(p).ensureAlpha().png().toBuffer(),
      left: i * FRAME_SIZE,
      top: 0,
    }))
  );
  await sharp({
    create: {
      width: n * FRAME_SIZE,
      height: FRAME_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function processCategory(cat) {
  const srcDir = path.join(ART_ROOT, cat);
  const outDir = path.join(OUT_ROOT, cat);
  await mkdir(outDir, { recursive: true });

  const entries = await readdir(srcDir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subdir = path.join(srcDir, entry.name);
      const detected = await detectFrames(subdir, entry.name);
      if (!detected) {
        console.warn(`⚠  ${cat}/${entry.name}/: unrecognized frame layout, skipped`);
        continue;
      }
      const outPath = path.join(outDir, `${entry.name}.png`);
      await stitchFrames(detected.frames, outPath);
      results.push({ name: entry.name, kind: detected.kind, frames: detected.frames.length });
    } else if (entry.isFile() && entry.name.endsWith(".png")) {
      const baseName = entry.name.replace(/\.png$/, "");
      const subdir = path.join(srcDir, baseName);
      // Skip flat .png if a subdir with the same name exists (subdir wins —
      // the flat file is likely a preview thumbnail of the animation).
      if (await isDir(subdir)) continue;
      const outPath = path.join(outDir, entry.name);
      await copyFile(path.join(srcDir, entry.name), outPath);
      results.push({ name: baseName, kind: "static", frames: 1 });
    }
  }

  return results;
}

async function main() {
  console.log(`Stitching frames from ${ART_ROOT} → ${OUT_ROOT}`);
  for (const cat of CATEGORIES) {
    const results = await processCategory(cat);
    for (const r of results) {
      const tag = r.kind === "static" ? "·" : `${r.kind}:${r.frames}`;
      console.log(`  ${cat}/${r.name} ${tag}`);
    }
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
