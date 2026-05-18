#!/usr/bin/env node
/**
 * Generate the free Gumroad pack: 2000 seeded-random pixabots.
 *
 * Per ID:
 *   - PNGs at 240, 480, 960, 1920
 *   - GIF at 480 (animated bounce)
 *
 * Output layout:
 *   pixabots-gumroad/pixabots-pack/   (inside the repo, gitignored)
 *     png/240/{id}.png
 *     png/480/{id}.png
 *     png/960/{id}.png
 *     png/1920/{id}.png
 *     gif/480/{id}.gif
 *     manifest.json   (list of all 2000 IDs, in seeded order)
 *     LICENSE.txt
 *     README.txt
 *
 * Idempotent: existing files are skipped (rerun-safe after Ctrl-C).
 *
 * Usage:
 *   node scripts/generate-gumroad-pack.mjs              # default
 *   COUNT=100 node scripts/generate-gumroad-pack.mjs    # smoke test
 *   OUT=/some/path node scripts/generate-gumroad-pack.mjs
 */

import sharp from "/Users/pablostanley/Dropbox/pixabots/app/node_modules/sharp/lib/index.js";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  PARTS,
  LAYER_ORDER,
  ANIM_FRAMES,
  LOOP_LENGTH,
  FRAME_MS,
  encode,
  mulberry32,
  hashString,
  resolveFrameIndex,
} from "/Users/pablostanley/Dropbox/pixabots/app/node_modules/@pixabots/core/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PARTS_DIR = path.join(ROOT, "app", "public", "parts");

const COUNT = Number(process.env.COUNT) || 2000;
const SEED = process.env.SEED || "pixabots-gumroad-pack-v1";
const OUT = process.env.OUT || path.join(ROOT, "pixabots-gumroad", "pixabots-pack");
const PNG_SIZES = [240, 480, 960, 1920];
const GIF_SIZE = 480;
const CONCURRENCY = Number(process.env.CONCURRENCY) || 8;

const NATIVE = 32;

async function loadLayers(combo) {
  const entries = await Promise.all(
    LAYER_ORDER.map(async (cat) => {
      const part = PARTS[cat][combo[cat]];
      const frames = part.frames ?? 1;
      const buffer = await sharp(path.join(PARTS_DIR, part.path))
        .resize(frames * NATIVE, NATIVE, { kernel: sharp.kernel.nearest })
        .png()
        .toBuffer();
      return [cat, { buffer, frames }];
    })
  );
  return Object.fromEntries(entries);
}

async function extractFrame(sheet, idx) {
  const f = Math.min(Math.max(0, idx), sheet.frames - 1);
  if (sheet.frames === 1) return sheet.buffer;
  return sharp(sheet.buffer)
    .extract({ left: f * NATIVE, top: 0, width: NATIVE, height: NATIVE })
    .png()
    .toBuffer();
}

async function renderPng(combo, size, layers) {
  const frame0s = await Promise.all(
    LAYER_ORDER.map(async (cat) => [cat, await extractFrame(layers[cat], 0)])
  );
  const map = Object.fromEntries(frame0s);
  const composites = LAYER_ORDER.map((cat) => ({ input: map[cat], left: 0, top: 0 }));
  const native = await sharp({
    create: { width: NATIVE, height: NATIVE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
  if (size === NATIVE) return native;
  return sharp(native).resize(size, size, { kernel: sharp.kernel.nearest }).png().toBuffer();
}

const ANIM_PAD = 4;

async function renderFrameNative(partByCategory, layers, bodyTop, bodyBottom, offsets, tick) {
  const frameByCat = Object.fromEntries(
    await Promise.all(
      LAYER_ORDER.map(async (cat) => {
        const idx = resolveFrameIndex(partByCategory[cat], tick);
        return [cat, await extractFrame(layers[cat], idx)];
      })
    )
  );

  const composites = [];
  for (const cat of LAYER_ORDER) {
    const off = Math.round(offsets[cat]);
    if (cat === "body" && off > 0) {
      composites.push({ input: bodyTop, left: 0, top: off });
      composites.push({ input: bodyBottom, left: 0, top: NATIVE - 1 });
    } else {
      composites.push({ input: frameByCat[cat], left: 0, top: off });
    }
  }

  const png = await sharp({
    create: { width: NATIVE, height: NATIVE + ANIM_PAD, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .extract({ left: 0, top: 0, width: NATIVE, height: NATIVE })
    .png()
    .toBuffer();

  return sharp(png).raw().toBuffer();
}

async function renderGif(combo, size, layers) {
  const bodyFrame0 = await extractFrame(layers.body, 0);
  const [bodyTop, bodyBottom] = await Promise.all([
    sharp(bodyFrame0).extract({ left: 0, top: 0, width: NATIVE, height: NATIVE - 1 }).png().toBuffer(),
    sharp(bodyFrame0).extract({ left: 0, top: NATIVE - 1, width: NATIVE, height: 1 }).png().toBuffer(),
  ]);

  const partByCategory = Object.fromEntries(
    LAYER_ORDER.map((cat) => [cat, PARTS[cat][combo[cat]]])
  );

  const anyAnimated = LAYER_ORDER.some((cat) => (partByCategory[cat].frames ?? 1) > 1);
  const ticks = anyAnimated ? LOOP_LENGTH : ANIM_FRAMES.length;

  const nativeFrames = await Promise.all(
    Array.from({ length: ticks }, (_, tick) => {
      const offsets = ANIM_FRAMES[tick % ANIM_FRAMES.length];
      return renderFrameNative(partByCategory, layers, bodyTop, bodyBottom, offsets, tick);
    })
  );

  const stacked = Buffer.concat(nativeFrames);
  const stripH = NATIVE * ticks;
  const targetStripH = size * ticks;
  const targetStripped =
    size === NATIVE
      ? stacked
      : await sharp(stacked, { raw: { width: NATIVE, height: stripH, channels: 4 } })
          .resize(size, targetStripH, { kernel: sharp.kernel.nearest })
          .raw()
          .toBuffer();

  const delay = Math.max(20, Math.round(FRAME_MS));
  const delays = Array.from({ length: ticks }, () => delay);

  return sharp(targetStripped, {
    raw: { width: size, height: targetStripH, channels: 4, pageHeight: size },
  })
    .gif({ delay: delays, loop: 0, effort: 10 })
    .toBuffer();
}

function pickIds() {
  const rng = mulberry32(hashString(SEED));
  const seen = new Set();
  const ids = [];
  while (ids.length < COUNT) {
    const combo = {};
    for (const cat of ["eyes", "heads", "body", "top"]) {
      combo[cat] = Math.floor(rng() * PARTS[cat].length);
    }
    const id = encode(combo);
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

async function ensureDirs() {
  for (const s of PNG_SIZES) await fs.mkdir(path.join(OUT, "png", String(s)), { recursive: true });
  await fs.mkdir(path.join(OUT, "gif", String(GIF_SIZE)), { recursive: true });
}

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function processOne(id) {
  const combo = {
    eyes: parseInt(id[0], 36),
    heads: parseInt(id[1], 36),
    body: parseInt(id[2], 36),
    top: parseInt(id[3], 36),
  };
  const layers = await loadLayers(combo);

  for (const size of PNG_SIZES) {
    const p = path.join(OUT, "png", String(size), `${id}.png`);
    if (await fileExists(p)) continue;
    const buf = await renderPng(combo, size, layers);
    await fs.writeFile(p, buf);
  }

  const gifPath = path.join(OUT, "gif", String(GIF_SIZE), `${id}.gif`);
  if (!(await fileExists(gifPath))) {
    const gif = await renderGif(combo, GIF_SIZE, layers);
    await fs.writeFile(gifPath, gif);
  }
}

async function runPool(items, worker, concurrency) {
  let cursor = 0;
  let done = 0;
  let failed = 0;
  const total = items.length;
  const startedAt = Date.now();

  async function pull() {
    while (cursor < total) {
      const i = cursor++;
      try {
        await worker(items[i], i);
      } catch (e) {
        failed++;
        console.error(`[${items[i]}] FAIL: ${e.message}`);
      }
      done++;
      if (done % 25 === 0 || done === total) {
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = done / elapsed;
        const eta = ((total - done) / rate).toFixed(0);
        process.stdout.write(
          `\r  ${done}/${total}  ${rate.toFixed(1)}/s  ETA ${eta}s  fails:${failed}    `
        );
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, pull));
  process.stdout.write("\n");
  return { done, failed };
}

async function main() {
  console.log(`Pack: ${COUNT} pixabots`);
  console.log(`Seed: "${SEED}"`);
  console.log(`Out:  ${OUT}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  await ensureDirs();
  const ids = pickIds();

  // Manifest
  await fs.writeFile(
    path.join(OUT, "manifest.json"),
    JSON.stringify({ seed: SEED, count: ids.length, sizes: { png: PNG_SIZES, gif: [GIF_SIZE] }, ids }, null, 2)
  );

  // LICENSE + README
  const license = `Pixabots — Free Pack (2,000 pixel characters)

Copyright (c) ${new Date().getFullYear()} Pablo Stanley

Free for personal, commercial, and editorial use.
Attribution appreciated but not required: pixabots.com

You may:
  - Use these images in apps, websites, games, presentations, prints, merchandise.
  - Modify, recolor, or composite as needed.
  - Redistribute as part of a larger work.

You may not:
  - Resell the images themselves as a standalone asset pack.
  - Claim authorship of the original art.

These are 2,000 of the 10,752 unique combinations available at pixabots.com.
The full set, custom palettes, API access, and CLI are also free over there.
`;
  await fs.writeFile(path.join(OUT, "LICENSE.txt"), license);

  const readme = `Pixabots Free Pack
==================

2,000 pixel characters, ready to drop into anything.

Folders:
  png/240    — 240×240 PNGs (UI / chat avatars)
  png/480    — 480×480 PNGs (cards, hero images)
  png/960    — 960×960 PNGs (retina / print)
  png/1920   — 1920×1920 PNGs (full HD, posters)
  gif/480    — animated bounce GIFs at 480px

Files are named by their 4-character ID — paste any ID at
https://pixabots.com/?id=XXXX to recreate it in the browser.

Want more?
  • All 10,752 combos: https://pixabots.com/browse
  • Free API:          https://pixabots.com/docs/api
  • npm + CLI:         https://www.npmjs.com/package/@pixabots/core

— Pablo
`;
  await fs.writeFile(path.join(OUT, "README.txt"), readme);

  // Render
  const { done, failed } = await runPool(ids, processOne, CONCURRENCY);

  const elapsed = ((Date.now() - Number(process.env._START || Date.now())) / 1000).toFixed(1);
  console.log(`\nDone. ${done} processed, ${failed} failed.`);
  console.log(`Output: ${OUT}`);
}

process.env._START = String(Date.now());
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
