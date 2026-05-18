#!/usr/bin/env node
/**
 * Render the animated-WebP variant for the Gumroad pack.
 *
 * One WebP per ID at 480px (matches the GIF size). Animated WebP is
 * ~30% smaller than GIF, supports alpha properly, plays in every modern
 * browser. We ship it alongside GIFs (not in place of) since some places
 * still only accept GIF.
 *
 * Reads the same manifest as generate-gumroad-pack.mjs. Idempotent.
 *
 * Usage:
 *   node scripts/generate-pack-webp.mjs
 *   COUNT=10 node scripts/generate-pack-webp.mjs       # smoke
 *   OUT=/some/path node scripts/generate-pack-webp.mjs
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
  resolveFrameIndex,
} from "/Users/pablostanley/Dropbox/pixabots/app/node_modules/@pixabots/core/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PARTS_DIR = path.join(ROOT, "app", "public", "parts");
const OUT = process.env.OUT || path.join(ROOT, "pixabots-gumroad", "pixabots-pack");
const SIZE = 480;
const CONCURRENCY = Number(process.env.CONCURRENCY) || 6;
const NATIVE = 32;
const ANIM_PAD = 4;

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

async function renderFrameNative(partByCat, layers, bodyTop, bodyBottom, offsets, tick) {
  const frameByCat = Object.fromEntries(
    await Promise.all(
      LAYER_ORDER.map(async (cat) => {
        const idx = resolveFrameIndex(partByCat[cat], tick);
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

async function renderWebp(combo, size, layers) {
  const bodyFrame0 = await extractFrame(layers.body, 0);
  const [bodyTop, bodyBottom] = await Promise.all([
    sharp(bodyFrame0).extract({ left: 0, top: 0, width: NATIVE, height: NATIVE - 1 }).png().toBuffer(),
    sharp(bodyFrame0).extract({ left: 0, top: NATIVE - 1, width: NATIVE, height: 1 }).png().toBuffer(),
  ]);
  const partByCat = Object.fromEntries(LAYER_ORDER.map((cat) => [cat, PARTS[cat][combo[cat]]]));
  const anyAnimated = LAYER_ORDER.some((cat) => (partByCat[cat].frames ?? 1) > 1);
  const ticks = anyAnimated ? LOOP_LENGTH : ANIM_FRAMES.length;

  const nativeFrames = await Promise.all(
    Array.from({ length: ticks }, (_, tick) =>
      renderFrameNative(partByCat, layers, bodyTop, bodyBottom, ANIM_FRAMES[tick % ANIM_FRAMES.length], tick)
    )
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
    .webp({ delay: delays, loop: 0, lossless: true, effort: 6 })
    .toBuffer();
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
  const p = path.join(OUT, "webp", String(SIZE), `${id}.webp`);
  if (await fileExists(p)) return;
  const layers = await loadLayers(combo);
  const buf = await renderWebp(combo, SIZE, layers);
  await fs.writeFile(p, buf);
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
        await worker(items[i]);
      } catch (e) {
        failed++;
        console.error(`[${items[i]}] FAIL: ${e.message}`);
      }
      done++;
      if (done % 25 === 0 || done === total) {
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = done / elapsed;
        const eta = ((total - done) / rate).toFixed(0);
        process.stdout.write(`\r  ${done}/${total}  ${rate.toFixed(1)}/s  ETA ${eta}s  fails:${failed}    `);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, pull));
  process.stdout.write("\n");
  return { done, failed };
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(OUT, "manifest.json"), "utf-8"));
  const ids = process.env.COUNT ? manifest.ids.slice(0, Number(process.env.COUNT)) : manifest.ids;
  console.log(`WebP: ${ids.length} @ ${SIZE}px`);
  console.log(`Out:  ${OUT}/webp/${SIZE}/\n`);
  await fs.mkdir(path.join(OUT, "webp", String(SIZE)), { recursive: true });
  const { done, failed } = await runPool(ids, processOne, CONCURRENCY);
  console.log(`\nDone. ${done} processed, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
