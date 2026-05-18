#!/usr/bin/env node
/**
 * Build the full Gumroad campaign: animated banners + social posts + HTML pages.
 *
 * Output:
 *   ~/Downloads/pixabots-gumroad/
 *     upload/
 *       gallery/             — Gumroad product gallery (animated)
 *         01-cover.gif       1280×720
 *         02-masonry.gif     1600×900
 *         03-loose.gif       1600×900
 *         04-dark.gif        1600×900
 *         05-hero-row.gif    1920×640
 *         06-minimal.gif     1600×900
 *       thumbnail.gif        1080×1080  (8 bots rotating)
 *     campaign/
 *       social/
 *         twitter.gif            1200×675
 *         instagram-square.gif   1080×1080
 *         instagram-story.gif    1080×1920
 *         linkedin.gif           1200×627
 *         facebook.gif           1200×630
 *
 * Reads source bot library from ~/Downloads/pixabots-pack/.
 * Each animated GIF is 4 frames × 500ms (2-second loop).
 *
 * Usage:
 *   node scripts/generate-gumroad-campaign.mjs
 */

import sharp from "/Users/pablostanley/Dropbox/pixabots/app/node_modules/sharp/lib/index.js";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const GUMROAD_ROOT = path.join(REPO, "pixabots-gumroad");
const PACK = process.env.PACK || path.join(GUMROAD_ROOT, "pixabots-pack");
const ROOT = process.env.OUT || GUMROAD_ROOT;
const UPLOAD_GALLERY = path.join(ROOT, "upload", "gallery");
const UPLOAD_DIR = path.join(ROOT, "upload");
const SOCIAL_DIR = path.join(ROOT, "campaign", "social");

const FRAMES = 4;
const FRAME_DELAY_MS = 500;

const PASTELS = [
  { r: 255, g: 223, b: 211 },  // peach
  { r: 215, g: 240, b: 219 },  // mint
  { r: 211, g: 232, b: 255 },  // sky
  { r: 240, g: 220, b: 255 },  // lavender
  { r: 255, g: 225, b: 235 },  // blush
  { r: 255, g: 244, b: 200 },  // butter
  { r: 220, g: 235, b: 215 },  // sage
  { r: 255, g: 218, b: 218 },  // coral
  { r: 230, g: 220, b: 255 },  // lilac
  { r: 213, g: 240, b: 240 },  // aqua
  { r: 250, g: 230, b: 210 },  // sand
  { r: 235, g: 224, b: 255 },  // wisteria
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickClosestSize(target) {
  const sizes = [240, 480, 960, 1920];
  return sizes.reduce((best, s) => (Math.abs(s - target) < Math.abs(best - target) ? s : best));
}

const BOT_CACHE = new Map();
async function loadBot(id, size) {
  const key = `${id}@${size}`;
  if (BOT_CACHE.has(key)) return BOT_CACHE.get(key);
  const src = pickClosestSize(size);
  const p = path.join(PACK, "png", String(src), `${id}.png`);
  const buf = await sharp(p).resize(size, size, { kernel: sharp.kernel.nearest }).png().toBuffer();
  BOT_CACHE.set(key, buf);
  return buf;
}

/**
 * Build one animated GIF.
 *
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {{r,g,b}} opts.bg
 * @param {{x,y,size}[]} opts.slots   placement of each tile
 * @param {string[]} opts.ids         id pool to draw from
 * @param {number} opts.seed
 * @returns {Promise<Buffer>}         GIF bytes
 */
async function buildAnimatedGrid({ width, height, bg, slots, ids, seed }) {
  const rng = mulberry32(seed);
  const bgRgba = { ...bg, alpha: 1 };

  const framesRaw = [];
  for (let f = 0; f < FRAMES; f++) {
    const composites = [];
    for (const slot of slots) {
      const id = ids[Math.floor(rng() * ids.length)];
      const buf = await loadBot(id, slot.size);
      composites.push({ input: buf, left: Math.round(slot.x), top: Math.round(slot.y) });
    }
    const framePng = await sharp({
      create: { width, height, channels: 4, background: bgRgba },
    })
      .composite(composites)
      .png()
      .toBuffer();
    // Strip alpha so the stacked raw buffer has a uniform 3-channel stride.
    const frameRaw = await sharp(framePng).removeAlpha().raw().toBuffer();
    framesRaw.push(frameRaw);
  }

  const stacked = Buffer.concat(framesRaw);
  const delays = Array.from({ length: FRAMES }, () => FRAME_DELAY_MS);

  return sharp(stacked, {
    raw: { width, height: height * FRAMES, channels: 3, pageHeight: height },
  })
    .gif({ delay: delays, loop: 0, effort: 10 })
    .toBuffer();
}

/**
 * Special-case for the Gumroad thumbnail: one bot per frame, centered with
 * padding, each frame on a different pastel bg. Loops through `count` bots
 * at `frameMs` per frame (slower than the grid banners — feels like a
 * polaroid carousel, not a glitch).
 */
async function buildAnimatedSingle({ width, height, count, padding, ids, seed, frameMs }) {
  const rng = mulberry32(seed);
  const tileSize = Math.min(width, height) - padding * 2;
  const x = Math.round((width - tileSize) / 2);
  const y = Math.round((height - tileSize) / 2);

  const framesRaw = [];
  for (let f = 0; f < count; f++) {
    const id = ids[Math.floor(rng() * ids.length)];
    const bg = { ...PASTELS[Math.floor(rng() * PASTELS.length)], alpha: 1 };
    const bot = await loadBot(id, tileSize);
    const framePng = await sharp({
      create: { width, height, channels: 4, background: bg },
    })
      .composite([{ input: bot, left: x, top: y }])
      .png()
      .toBuffer();
    const frameRaw = await sharp(framePng).removeAlpha().raw().toBuffer();
    framesRaw.push(frameRaw);
  }

  const stacked = Buffer.concat(framesRaw);
  const delays = Array.from({ length: count }, () => frameMs);

  return sharp(stacked, {
    raw: { width, height: height * count, channels: 3, pageHeight: height },
  })
    .gif({ delay: delays, loop: 0, effort: 10 })
    .toBuffer();
}

/* -------------------------- layout generators ------------------------ */

function uniformGrid(W, H, cols, rows, bg, opts = {}) {
  const tile = Math.floor(Math.min(W / cols, H / rows));
  const xOff = Math.floor((W - tile * cols) / 2);
  const yOff = opts.bleedTop ? -Math.floor(tile / 2) : Math.floor((H - tile * rows) / 2);
  const realRows = opts.bleedTop ? rows + 1 : rows;
  const slots = [];
  for (let r = 0; r < realRows; r++) {
    for (let c = 0; c < cols; c++) {
      const y = yOff + r * tile;
      if (y >= H) continue;
      slots.push({ x: xOff + c * tile, y, size: tile });
    }
  }
  return { width: W, height: H, bg, slots };
}

function masonryLayout(W, H, seed) {
  const rng = mulberry32(seed);
  const COLS = 10;
  const colW = W / COLS;
  const colY = new Array(COLS).fill(0);
  const slots = [];
  while (Math.min(...colY) < H) {
    const c = colY.indexOf(Math.min(...colY));
    const choices = [colW, colW * 2, colW];
    const span = choices[Math.floor(rng() * choices.length)];
    if (colY[c] + span > H) {
      colY[c] = H;
      continue;
    }
    slots.push({ x: c * colW, y: colY[c], size: span });
    colY[c] += span;
  }
  return slots;
}

function looseGrid(W, H) {
  const COLS = 9;
  const ROWS = 5;
  const tile = 140;
  const gap = (W - COLS * tile) / (COLS + 1);
  const yOff = Math.floor((H - ROWS * tile - (ROWS - 1) * gap) / 2);
  const slots = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      slots.push({ x: gap + c * (tile + gap), y: yOff + r * (tile + gap), size: tile });
    }
  }
  return slots;
}

function heroRow(W, H, tile) {
  const COUNT = Math.ceil(W / tile) + 1;
  const yOff = Math.floor((H - tile) / 2);
  const slots = [];
  for (let i = 0; i < COUNT; i++) slots.push({ x: i * tile, y: yOff, size: tile });
  return slots;
}

function minimalLayout() {
  return [
    { size: 320, x: 120, y: 290 },
    { size: 220, x: 520, y: 130 },
    { size: 260, x: 540, y: 470 },
    { size: 200, x: 900, y: 280 },
    { size: 280, x: 1180, y: 110 },
    { size: 180, x: 1240, y: 540 },
    { size: 140, x: 880, y: 660 },
    { size: 120, x: 360, y: 720 },
  ];
}

/* ----------------------------- main ---------------------------------- */

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(PACK, "manifest.json"), "utf-8"));
  const ids = manifest.ids;
  console.log(`Source: ${ids.length} ids from ${PACK}`);
  console.log(`Frames: ${FRAMES} × ${FRAME_DELAY_MS}ms\n`);

  await fs.mkdir(UPLOAD_GALLERY, { recursive: true });
  await fs.mkdir(SOCIAL_DIR, { recursive: true });

  const cream = { r: 245, g: 240, b: 230 };
  const warm = { r: 250, g: 246, b: 240 };
  const pale = { r: 252, g: 247, b: 235 };
  const dark = { r: 14, g: 14, b: 18 };
  const blue = { r: 30, g: 90, b: 200 };
  const stone = { r: 248, g: 244, b: 238 };

  /* gallery (Gumroad product page) */
  const gallery = [
    { name: "01-cover.gif", spec: { ...uniformGrid(1280, 720, 16, 9, cream), ids, seed: 1 } },
    { name: "02-grid-4x3.gif", spec: { ...uniformGrid(1600, 900, 4, 3, warm), ids, seed: 2 } },
    { name: "03-loose.gif", spec: { width: 1600, height: 900, bg: pale, slots: looseGrid(1600, 900), ids, seed: 3 } },
    { name: "04-dark.gif", spec: { ...uniformGrid(1600, 900, 20, 11, dark, { bleedTop: true }), ids, seed: 4 } },
    { name: "05-hero-row.gif", spec: { width: 1600, height: 900, bg: blue, slots: heroRow(1600, 900, 720), ids, seed: 5 } },
    { name: "06-grid-3x2.gif", spec: { ...uniformGrid(1600, 900, 3, 2, stone), ids, seed: 6 } },
  ];

  for (const g of gallery) {
    const buf = await buildAnimatedGrid(g.spec);
    await fs.writeFile(path.join(UPLOAD_GALLERY, g.name), buf);
    console.log(`  upload/gallery/${g.name}  ${(buf.length / 1024).toFixed(0)} KB`);
  }

  /* Gumroad square thumbnail — single bot, padded, pastel bg cycles. 1080×1080. */
  const thumb = await buildAnimatedSingle({
    width: 1080,
    height: 1080,
    count: 12,
    padding: 140,
    ids,
    seed: 100,
    frameMs: 600,
  });
  await fs.writeFile(path.join(UPLOAD_DIR, "thumbnail.gif"), thumb);
  console.log(`  upload/thumbnail.gif  ${(thumb.length / 1024).toFixed(0)} KB`);

  /* Social — same animated treatment at canonical sizes */
  const social = [
    { name: "twitter.gif", spec: { ...uniformGrid(1200, 675, 15, 9, cream), ids, seed: 201 } },
    { name: "instagram-square.gif", spec: { ...uniformGrid(1080, 1080, 9, 9, cream), ids, seed: 202 } },
    { name: "instagram-story.gif", spec: { ...uniformGrid(1080, 1920, 6, 11, dark, { bleedTop: true }), ids, seed: 203 } },
    { name: "linkedin.gif", spec: { ...uniformGrid(1200, 627, 16, 9, pale), ids, seed: 204 } },
    { name: "facebook.gif", spec: { ...uniformGrid(1200, 630, 15, 8, warm), ids, seed: 205 } },
  ];

  for (const s of social) {
    const buf = await buildAnimatedGrid(s.spec);
    await fs.writeFile(path.join(SOCIAL_DIR, s.name), buf);
    console.log(`  campaign/social/${s.name}  ${(buf.length / 1024).toFixed(0)} KB`);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
