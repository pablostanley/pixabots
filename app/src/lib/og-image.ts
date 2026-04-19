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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const s = hex.replace(/^#/, "");
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

/** Shared sharp canvas. Every layout composes overlays onto this. */
function composeOg(overlays: sharp.OverlayOptions[], bg?: string): Promise<Buffer> {
  const base = bg
    ? { ...hexToRgb(bg), alpha: 1 }
    : { r: 0, g: 0, b: 0, alpha: 1 };
  return sharp({
    create: {
      width: OG_W,
      height: OG_H,
      channels: 4,
      background: base,
    },
  })
    .composite(overlays)
    .png()
    .toBuffer();
}

/**
 * Lay a row of bots centered horizontally with a label underneath; vertically
 * center the whole (bot + gap + label) group inside OG_H so the label never
 * clips off the bottom.
 */
function layoutBotsWithLabel(
  bots: Buffer[],
  size: number,
  gap: number,
  label: { svg: Buffer; w: number; h: number }
): sharp.OverlayOptions[] {
  const n = bots.length;
  const totalW = size * n + gap * Math.max(0, n - 1);
  const left0 = Math.floor((OG_W - totalW) / 2);
  const labelGap = 40;
  const groupH = size + labelGap + label.h;
  const botTop = Math.max(40, Math.floor((OG_H - groupH) / 2));
  const labelTop = botTop + size + labelGap;

  const overlays: sharp.OverlayOptions[] = bots.map((input, i) => ({
    input,
    left: left0 + i * (size + gap),
    top: botTop,
  }));
  overlays.push({
    input: label.svg,
    left: Math.round((OG_W - label.w) / 2),
    top: labelTop,
  });
  return overlays;
}

export type OgOptions =
  | { type: "grid"; title: string; subtitle?: string; seed?: string; palette?: PaletteTransform; bg?: string }
  | { type: "single"; id: string; title: string; subtitle?: string; palette?: PaletteTransform; bg?: string }
  | { type: "compare"; ids: string[]; title: string; subtitle?: string; palette?: PaletteTransform; bg?: string };

export async function generateOgImage(opts: OgOptions): Promise<Buffer> {
  if (opts.type === "grid") {
    return generateGrid(opts.title, opts.subtitle, opts.seed ?? opts.title, opts.palette, opts.bg);
  }
  if (opts.type === "compare") {
    return generateCompare(opts.ids, opts.title, opts.subtitle, opts.palette, opts.bg);
  }
  return generateSingle(opts.id, opts.title, opts.subtitle, opts.palette, opts.bg);
}

async function generateGrid(
  title: string,
  subtitle: string | undefined,
  seed: string,
  palette?: PaletteTransform,
  bg?: string
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

  const label = buildLabel(title, subtitle);
  const overlays: sharp.OverlayOptions[] = [
    ...rendered,
    {
      input: label.svg,
      left: Math.round((OG_W - label.w) / 2),
      top: Math.round((OG_H - label.h) / 2),
    },
  ];

  return composeOg(overlays, bg);
}

async function generateCompare(
  ids: string[],
  title: string,
  subtitle: string | undefined,
  palette?: PaletteTransform,
  bg?: string
): Promise<Buffer> {
  const n = ids.length;
  const gap = 20;
  const horizPad = 80;
  const available = OG_W - horizPad * 2 - gap * Math.max(0, n - 1);
  const size = Math.min(380, Math.floor(available / n));

  const bots = await Promise.all(ids.map((id) => renderBot(id, size, palette)));
  const label = buildLabel(title, subtitle);
  return composeOg(layoutBotsWithLabel(bots, size, gap, label), bg);
}

async function generateSingle(
  id: string,
  title: string,
  subtitle: string | undefined,
  palette?: PaletteTransform,
  bg?: string
): Promise<Buffer> {
  const size = 380;
  const bot = await renderBot(id, size, palette);
  const label = buildLabel(title, subtitle);
  return composeOg(layoutBotsWithLabel([bot], size, 0, label), bg);
}

