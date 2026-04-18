import sharp from "sharp";
import opentype from "opentype.js";
import fs from "node:fs";
import path from "node:path";
import {
  PARTS,
  LAYER_ORDER,
  seededId,
  decode,
  isValidId,
} from "@pixabots/core";

const OG_W = 1200;
const OG_H = 630;
const NATIVE = 32;

const FONTS_DIR = path.join(process.cwd(), "src", "lib", "fonts");
const PARTS_DIR = path.join(process.cwd(), "public", "parts");

let boldFont: opentype.Font | null = null;
function getBoldFont() {
  if (!boldFont) {
    const buf = fs.readFileSync(path.join(FONTS_DIR, "PixelifySans-Bold.ttf"));
    boldFont = opentype.parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    );
  }
  return boldFont;
}

async function renderBot(id: string, size: number): Promise<Buffer> {
  if (!isValidId(id)) throw new Error(`Invalid pixabot ID: ${id}`);
  const combo = decode(id);
  const composites: sharp.OverlayOptions[] = [];
  for (const cat of LAYER_ORDER) {
    const part = PARTS[cat][combo[cat]];
    const buf = await sharp(path.join(PARTS_DIR, part.path))
      .resize(NATIVE, NATIVE, { kernel: sharp.kernel.nearest })
      .toBuffer();
    composites.push({ input: buf, left: 0, top: 0 });
  }
  const native = await sharp({
    create: {
      width: NATIVE,
      height: NATIVE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
  return sharp(native)
    .resize(size, size, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
}

function buildLabel(title: string, subtitle?: string) {
  const font = getBoldFont();
  const titleSize = 56;
  const subSize = 24;
  const padX = 32;
  const padY = 22;
  const gap = subtitle ? 10 : 0;
  const radius = 12;

  const titleBBox = font.getPath(title, 0, 0, titleSize).getBoundingBox();
  const titleW = titleBBox.x2 - titleBBox.x1;

  let subW = 0;
  if (subtitle) {
    const sBBox = font.getPath(subtitle, 0, 0, subSize).getBoundingBox();
    subW = sBBox.x2 - sBBox.x1;
  }

  const contentW = Math.max(titleW, subW);
  const boxW = Math.ceil(contentW + padX * 2);
  const boxH = Math.ceil(titleSize + (subtitle ? gap + subSize : 0) + padY * 2);
  const titleX = padX + (contentW - titleW) / 2;
  const subX = padX + (contentW - subW) / 2;

  const titleD = font
    .getPath(title, titleX, padY + titleSize * 0.82, titleSize)
    .toPathData(2);
  const subD = subtitle
    ? font
        .getPath(subtitle, subX, padY + titleSize + gap + subSize * 0.82, subSize)
        .toPathData(2)
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${boxW}" height="${boxH}"><rect width="${boxW}" height="${boxH}" rx="${radius}" ry="${radius}" fill="black"/><path d="${titleD}" fill="white"/>${subD ? `<path d="${subD}" fill="#888"/>` : ""}</svg>`;
  return { svg: Buffer.from(svg), w: boxW, h: boxH };
}

export type OgOptions =
  | { type: "grid"; title: string; subtitle?: string; seed?: string }
  | { type: "single"; id: string; title: string; subtitle?: string };

export async function generateOgImage(opts: OgOptions): Promise<Buffer> {
  if (opts.type === "grid") {
    return generateGrid(opts.title, opts.subtitle, opts.seed ?? opts.title);
  }
  return generateSingle(opts.id, opts.title, opts.subtitle);
}

async function generateGrid(
  title: string,
  subtitle: string | undefined,
  seed: string
): Promise<Buffer> {
  const cols = 6;
  const rows = 3;
  const gap = 24;
  const padding = 48;
  const cellW = (OG_W - padding * 2 - gap * (cols - 1)) / cols;

  const positions: sharp.OverlayOptions[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = seededId(`${seed}-${r}-${c}`);
      const bot = await renderBot(id, Math.round(cellW));
      positions.push({
        input: bot,
        left: Math.round(padding + c * (cellW + gap)),
        top: Math.round(padding + r * (cellW + gap)),
      });
    }
  }

  const label = buildLabel(title, subtitle);
  positions.push({
    input: label.svg,
    left: Math.round((OG_W - label.w) / 2),
    top: Math.round((OG_H - label.h) / 2),
  });

  return sharp({
    create: {
      width: OG_W,
      height: OG_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite(positions)
    .png()
    .toBuffer();
}

async function generateSingle(
  id: string,
  title: string,
  subtitle: string | undefined
): Promise<Buffer> {
  const size = 380;
  const bot = await renderBot(id, size);
  const label = buildLabel(title, subtitle);

  const botTop = 80;
  const labelTop = botTop + size + 40;

  return sharp({
    create: {
      width: OG_W,
      height: OG_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      { input: bot, left: Math.round((OG_W - size) / 2), top: botTop },
      {
        input: label.svg,
        left: Math.round((OG_W - label.w) / 2),
        top: labelTop,
      },
    ])
    .png()
    .toBuffer();
}

/** Resolve a pixabot ID to a "part1 · part2 · part3 · part4" string. */
export function resolvePartsLabel(id: string): string {
  const combo = decode(id);
  return [
    PARTS.eyes[combo.eyes].name,
    PARTS.heads[combo.heads].name,
    PARTS.body[combo.body].name,
    PARTS.top[combo.top].name,
  ].join(" · ");
}
