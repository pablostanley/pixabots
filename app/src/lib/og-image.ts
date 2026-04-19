import sharp from "sharp";
import opentype from "opentype.js";
import fs from "node:fs";
import path from "node:path";
import { seededId, decode, isValidId } from "@pixabots/core";
import { FONTS_DIR } from "@/lib/paths";
import { renderPixabot, type PaletteTransform } from "@/lib/render";

const OG_W = 1200;
const OG_H = 630;
// opentype getPath Y = baseline. Empirical cap-height offset for Pixelify Sans.
const ASCENDER_RATIO = 0.82;

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

async function renderBot(id: string, size: number, palette?: PaletteTransform): Promise<Buffer> {
  if (!isValidId(id)) throw new Error(`Invalid pixabot ID: ${id}`);
  return renderPixabot(decode(id), size, palette);
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
    .getPath(title, titleX, padY + titleSize * ASCENDER_RATIO, titleSize)
    .toPathData(2);
  const subD = subtitle
    ? font
        .getPath(subtitle, subX, padY + titleSize + gap + subSize * ASCENDER_RATIO, subSize)
        .toPathData(2)
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${boxW}" height="${boxH}"><rect width="${boxW}" height="${boxH}" rx="${radius}" ry="${radius}" fill="black"/><path d="${titleD}" fill="white"/>${subD ? `<path d="${subD}" fill="#888"/>` : ""}</svg>`;
  return { svg: Buffer.from(svg), w: boxW, h: boxH };
}

export type OgOptions =
  | { type: "grid"; title: string; subtitle?: string; seed?: string; palette?: PaletteTransform }
  | { type: "single"; id: string; title: string; subtitle?: string; palette?: PaletteTransform }
  | { type: "compare"; ids: string[]; title: string; subtitle?: string; palette?: PaletteTransform };

export async function generateOgImage(opts: OgOptions): Promise<Buffer> {
  if (opts.type === "grid") {
    return generateGrid(opts.title, opts.subtitle, opts.seed ?? opts.title, opts.palette);
  }
  if (opts.type === "compare") {
    return generateCompare(opts.ids, opts.title, opts.subtitle, opts.palette);
  }
  return generateSingle(opts.id, opts.title, opts.subtitle, opts.palette);
}

async function generateGrid(
  title: string,
  subtitle: string | undefined,
  seed: string,
  palette?: PaletteTransform
): Promise<Buffer> {
  const cols = 6;
  const rows = 3;
  const gap = 24;
  const padding = 48;
  const cellW = (OG_W - padding * 2 - gap * (cols - 1)) / cols;

  const cellSize = Math.round(cellW);
  const cells: { r: number; c: number; id: string }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ r, c, id: seededId(`${seed}-${r}-${c}`) });
    }
  }

  const rendered = await Promise.all(
    cells.map(async ({ r, c, id }) => ({
      input: await renderBot(id, cellSize, palette),
      left: Math.round(padding + c * (cellW + gap)),
      top: Math.round(padding + r * (cellW + gap)),
    }))
  );

  const positions: sharp.OverlayOptions[] = [...rendered];

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

async function generateCompare(
  ids: string[],
  title: string,
  subtitle: string | undefined,
  palette?: PaletteTransform
): Promise<Buffer> {
  const n = ids.length;
  const gap = 20;
  const horizPad = 80;
  const available = OG_W - horizPad * 2 - gap * Math.max(0, n - 1);
  const size = Math.min(380, Math.floor(available / n));
  const totalW = size * n + gap * Math.max(0, n - 1);
  const left0 = Math.floor((OG_W - totalW) / 2);
  const botTop = 80;
  const labelTop = botTop + size + 40;

  const bots = await Promise.all(ids.map((id) => renderBot(id, size, palette)));
  const positions: sharp.OverlayOptions[] = bots.map((input, i) => ({
    input,
    left: left0 + i * (size + gap),
    top: botTop,
  }));

  const label = buildLabel(title, subtitle);
  positions.push({
    input: label.svg,
    left: Math.round((OG_W - label.w) / 2),
    top: labelTop,
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
  subtitle: string | undefined,
  palette?: PaletteTransform
): Promise<Buffer> {
  const size = 380;
  const bot = await renderBot(id, size, palette);
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

