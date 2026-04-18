import sharp from "/Users/pablostanley/Dropbox/pixabots/app/node_modules/sharp/lib/index.js";
import opentype from "/Users/pablostanley/Dropbox/pixabots/app/node_modules/opentype.js/dist/opentype.module.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PARTS, LAYER_ORDER, randomId, decode } from "/Users/pablostanley/Dropbox/pixabots/app/node_modules/@pixabots/core/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PARTS_DIR = path.join(ROOT, "app", "public", "parts");
const OUT_DIR = "/tmp";

const fontBold = opentype.parse(readFileSync(path.join(__dirname, "PixelifySans-Bold.ttf")).buffer);

const OG_W = 1200;
const OG_H = 630;
const NATIVE = 32;

async function renderBot(id, size) {
  const combo = decode(id);
  const composites = [];
  for (const cat of LAYER_ORDER) {
    const part = PARTS[cat][combo[cat]];
    const buf = await sharp(path.join(PARTS_DIR, part.path))
      .resize(NATIVE, NATIVE, { kernel: sharp.kernel.nearest })
      .toBuffer();
    composites.push({ input: buf, left: 0, top: 0 });
  }
  const native = await sharp({
    create: { width: NATIVE, height: NATIVE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
  return sharp(native).resize(size, size, { kernel: sharp.kernel.nearest }).png().toBuffer();
}

/** Build label SVG using opentype.js → vector paths, sized to content. */
function buildLabel(title, subtitle) {
  const titleSize = 56;
  const subSize = 24;
  const padX = 32;
  const padY = 22;
  const gap = subtitle ? 10 : 0;

  const titlePath = fontBold.getPath(title, 0, titleSize * 0.82, titleSize);
  const titleBBox = titlePath.getBoundingBox();
  const titleW = titleBBox.x2 - titleBBox.x1;

  let subPath = null;
  let subW = 0;
  if (subtitle) {
    subPath = fontBold.getPath(subtitle, 0, titleSize + gap + subSize * 0.82, subSize);
    const sBBox = subPath.getBoundingBox();
    subW = sBBox.x2 - sBBox.x1;
  }

  const contentW = Math.max(titleW, subW);
  const boxW = Math.ceil(contentW + padX * 2);
  const boxH = Math.ceil(titleSize + (subtitle ? gap + subSize : 0) + padY * 2);
  const titleX = padX + (contentW - titleW) / 2;
  const subX = padX + (contentW - subW) / 2;

  const titleD = fontBold.getPath(title, titleX, padY + titleSize * 0.82, titleSize).toPathData(2);
  const subD = subtitle
    ? fontBold.getPath(subtitle, subX, padY + titleSize + gap + subSize * 0.82, subSize).toPathData(2)
    : "";

  const radius = 12;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${boxW}" height="${boxH}">
    <rect width="${boxW}" height="${boxH}" rx="${radius}" ry="${radius}" fill="black"/>
    <path d="${titleD}" fill="white"/>
    ${subD ? `<path d="${subD}" fill="#888"/>` : ""}
  </svg>`;
  return { svg, w: boxW, h: boxH };
}

async function generateGrid(title, subtitle, outName) {
  const cols = 6;
  const rows = 3;
  const gap = 24;
  const padding = 48;
  const cellW = (OG_W - padding * 2 - gap * (cols - 1)) / cols;

  const composites = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = randomId();
      const bot = await renderBot(id, Math.round(cellW));
      composites.push({
        input: bot,
        left: Math.round(padding + c * (cellW + gap)),
        top: Math.round(padding + r * (cellW + gap)),
      });
    }
  }

  const label = buildLabel(title, subtitle);
  composites.push({
    input: Buffer.from(label.svg),
    left: Math.round((OG_W - label.w) / 2),
    top: Math.round((OG_H - label.h) / 2),
  });

  const out = await sharp({
    create: { width: OG_W, height: OG_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
  })
    .composite(composites)
    .png()
    .toBuffer();

  const outPath = path.join(OUT_DIR, outName);
  await sharp(out).toFile(outPath);
  console.log(`→ ${outPath}`);
}

async function generateSingle(id, title, subtitle, outName) {
  const size = 380;
  const bot = await renderBot(id, size);
  const label = buildLabel(title, subtitle);

  const botTop = 80;
  const labelTop = botTop + size + 40;

  const out = await sharp({
    create: { width: OG_W, height: OG_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
  })
    .composite([
      { input: bot, left: Math.round((OG_W - size) / 2), top: botTop },
      {
        input: Buffer.from(label.svg),
        left: Math.round((OG_W - label.w) / 2),
        top: labelTop,
      },
    ])
    .png()
    .toBuffer();

  const outPath = path.join(OUT_DIR, outName);
  await sharp(out).toFile(outPath);
  console.log(`→ ${outPath}`);
}

await generateGrid("Pixabots", null, "og-home.png");
await generateGrid("Pixabots Docs", "API reference + SDK", "og-docs.png");
await generateGrid("Pixabots API", "REST endpoints", "og-api.png");
await generateGrid("Browse Pixabots", null, "og-browse.png");
await generateSingle("2156", "Pixabot 2156", "glasses · blob · wings · mohawk", "og-single-2156.png");
await generateSingle("f76a", "Pixabot f76a", "wayfarer-face · punch-bowl · fire · horns", "og-single-f76a.png");
