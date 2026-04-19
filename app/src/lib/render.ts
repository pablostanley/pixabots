import sharp from "sharp";
import path from "path";
import {
  PARTS,
  LAYER_ORDER,
  ANIM_FRAMES,
  LOOP_LENGTH,
  FRAME_MS,
  resolveFrameIndex,
  type PixabotCombo,
  type AnimFrame,
  type PartCategory,
} from "@pixabots/core";
import { PARTS_DIR } from "@/lib/paths";

const NATIVE_SIZE = 32;
const ANIM_PAD = 4;

type LayerSheet = { buffer: Buffer; frames: number };

export class RenderError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

async function loadLayers(combo: PixabotCombo): Promise<Record<PartCategory, LayerSheet>> {
  const entries = await Promise.all(
    LAYER_ORDER.map(async (category) => {
      const part = PARTS[category][combo[category]];
      if (!part) throw new RenderError(`Unknown part index ${combo[category]} for "${category}"`, 400);
      const frames = part.frames ?? 1;
      const sheetWidth = frames * NATIVE_SIZE;
      const filePath = path.join(PARTS_DIR, part.path);
      try {
        const buffer = await sharp(filePath)
          .resize(sheetWidth, NATIVE_SIZE, { kernel: sharp.kernel.nearest })
          .png()
          .toBuffer();
        return [category, { buffer, frames }] as const;
      } catch {
        throw new RenderError(`Sprite not found: ${part.path}`, 404);
      }
    })
  );
  return Object.fromEntries(entries) as Record<PartCategory, LayerSheet>;
}

async function extractFrame(sheet: LayerSheet, frameIdx: number): Promise<Buffer> {
  const f = Math.min(Math.max(0, frameIdx), sheet.frames - 1);
  if (sheet.frames === 1) return sheet.buffer;
  return sharp(sheet.buffer)
    .extract({ left: f * NATIVE_SIZE, top: 0, width: NATIVE_SIZE, height: NATIVE_SIZE })
    .png()
    .toBuffer();
}

export type PaletteTransform = {
  /** Hue rotation in degrees (0–359). */
  hue?: number;
  /** Saturation multiplier (0 = greyscale, 1 = unchanged, >1 = punchier). */
  saturate?: number;
};

function hasPaletteTransform(p?: PaletteTransform): p is PaletteTransform {
  if (!p) return false;
  const hue = p.hue ?? 0;
  const saturate = p.saturate ?? 1;
  return hue !== 0 || saturate !== 1;
}

function applyPalette(pipeline: sharp.Sharp, p?: PaletteTransform): sharp.Sharp {
  if (!hasPaletteTransform(p)) return pipeline;
  const hue = ((p.hue ?? 0) % 360 + 360) % 360;
  const saturate = Math.max(0, Math.min(4, p.saturate ?? 1));
  return pipeline.modulate({
    hue: hue || undefined,
    saturation: saturate !== 1 ? saturate : undefined,
  });
}

/** Render a pixabot combo to a PNG buffer at the specified size. */
export async function renderPixabot(
  combo: PixabotCombo,
  size: number = NATIVE_SIZE,
  palette?: PaletteTransform,
  bg?: string
): Promise<Buffer> {
  const layers = await loadLayers(combo);
  const frame0s = await Promise.all(
    LAYER_ORDER.map(async (cat) => [cat, await extractFrame(layers[cat], 0)] as const)
  );
  const layerFrames = Object.fromEntries(frame0s) as Record<PartCategory, Buffer>;
  const composites = LAYER_ORDER.map((cat) => ({
    input: layerFrames[cat],
    left: 0,
    top: 0,
  }));

  const base = sharp({
    create: {
      width: NATIVE_SIZE,
      height: NATIVE_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png();

  const native = await base.toBuffer();
  // Apply palette at native size (fewer pixels = faster), then flatten onto
  // bg if one was given, then scale.
  let working = sharp(native);
  if (hasPaletteTransform(palette)) working = applyPalette(working, palette);
  if (bg) working = working.flatten({ background: bg });
  const tinted = hasPaletteTransform(palette) || bg
    ? await working.png().toBuffer()
    : native;

  if (size === NATIVE_SIZE) return tinted;

  return sharp(tinted)
    .resize(size, size, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
}

/** Render a pixabot combo as an SVG string (one <rect> per opaque pixel). */
export async function renderPixabotSvg(
  combo: PixabotCombo,
  size: number = 128,
  bg?: string
): Promise<string> {
  const layers = await loadLayers(combo);
  const frame0s = await Promise.all(
    LAYER_ORDER.map(async (cat) => [cat, await extractFrame(layers[cat], 0)] as const)
  );
  const layerFrames = Object.fromEntries(frame0s) as Record<PartCategory, Buffer>;
  const composites = LAYER_ORDER.map((cat) => ({
    input: layerFrames[cat],
    left: 0,
    top: 0,
  }));
  const raw = await sharp({
    create: {
      width: NATIVE_SIZE,
      height: NATIVE_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .raw()
    .toBuffer();

  const rects: string[] = [];
  for (let y = 0; y < NATIVE_SIZE; y++) {
    for (let x = 0; x < NATIVE_SIZE; x++) {
      const i = (y * NATIVE_SIZE + x) * 4;
      const r = raw[i];
      const g = raw[i + 1];
      const b = raw[i + 2];
      const a = raw[i + 3];
      if (a === 0) continue;
      const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      if (a === 255) {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${hex}"/>`);
      } else {
        rects.push(
          `<rect x="${x}" y="${y}" width="1" height="1" fill="${hex}" fill-opacity="${(a / 255).toFixed(3)}"/>`
        );
      }
    }
  }

  const bgRect = bg
    ? `<rect x="0" y="0" width="${NATIVE_SIZE}" height="${NATIVE_SIZE}" fill="${bg}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${NATIVE_SIZE} ${NATIVE_SIZE}" shape-rendering="crispEdges">${bgRect}${rects.join("")}</svg>`;
}

async function renderFrameNative(
  combo: PixabotCombo,
  layers: Record<PartCategory, LayerSheet>,
  bodyTop: Buffer,
  bodyBottom: Buffer,
  offsets: AnimFrame,
  tick: number
): Promise<Buffer> {
  const composites: sharp.OverlayOptions[] = [];

  // Per-layer sub-animation: each part declares its own schedule via `kind`
  // (static / blink / sequence). resolveFrameIndex maps tick → sheet frame.
  const frameByCategory: Record<PartCategory, Buffer> = Object.fromEntries(
    await Promise.all(
      LAYER_ORDER.map(async (cat) => {
        const part = PARTS[cat][combo[cat]];
        const scheduled = resolveFrameIndex(part, tick);
        return [cat, await extractFrame(layers[cat], scheduled)] as const;
      })
    )
  ) as Record<PartCategory, Buffer>;

  // Feet-stay-planted: body bottom row fixed at y=31, top 31 rows shifted.
  // Matches client-side canvas logic in creator.tsx. Uses the pre-sliced
  // frame-0 body top/bottom (body sub-animations TBD).
  for (const cat of LAYER_ORDER) {
    const off = Math.round(offsets[cat as keyof AnimFrame]);
    if (cat === "body" && off > 0) {
      composites.push({ input: bodyTop, left: 0, top: off });
      composites.push({ input: bodyBottom, left: 0, top: NATIVE_SIZE - 1 });
    } else {
      composites.push({ input: frameByCategory[cat], left: 0, top: off });
    }
  }

  // Two-step pipeline: sharp can't chain extract→raw on a created canvas
  const png = await sharp({
    create: {
      width: NATIVE_SIZE,
      height: NATIVE_SIZE + ANIM_PAD,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .extract({ left: 0, top: 0, width: NATIVE_SIZE, height: NATIVE_SIZE })
    .png()
    .toBuffer();

  return sharp(png).raw().toBuffer();
}

export type AnimatedFormat = "gif" | "webp";

/** Render an animated GIF or WebP of the bounce animation. */
export async function renderAnimatedPixabot(
  combo: PixabotCombo,
  size: number = NATIVE_SIZE,
  speed: number = 1,
  format: AnimatedFormat = "gif",
  palette?: PaletteTransform,
  bg?: string
): Promise<Buffer> {
  const layers = await loadLayers(combo);

  // Precompute body frame-0 split top/bottom once; body sub-animations not
  // supported yet (feet-planted split needs per-frame body rows).
  const bodyFrame0 = await extractFrame(layers.body, 0);
  const [bodyTop, bodyBottom] = await Promise.all([
    sharp(bodyFrame0)
      .extract({ left: 0, top: 0, width: NATIVE_SIZE, height: NATIVE_SIZE - 1 })
      .png()
      .toBuffer(),
    sharp(bodyFrame0)
      .extract({ left: 0, top: NATIVE_SIZE - 1, width: NATIVE_SIZE, height: 1 })
      .png()
      .toBuffer(),
  ]);

  // Composite each tick of the LOOP_LENGTH super-loop (bounce wraps at
  // ANIM_FRAMES.length). Stack all ticks in one raw strip and resize once —
  // cuts memory ~size² vs upscaling each frame independently.
  const nativeFrames = await Promise.all(
    Array.from({ length: LOOP_LENGTH }, (_, tick) => {
      const offsets = ANIM_FRAMES[tick % ANIM_FRAMES.length];
      return renderFrameNative(combo, layers, bodyTop, bodyBottom, offsets, tick);
    })
  );
  const nativeStacked = Buffer.concat(nativeFrames);
  const nativeStripHeight = NATIVE_SIZE * LOOP_LENGTH;

  // Palette transform + bg flatten at native scale before resize —
  // fewer pixels, same result.
  let nativePipeline = sharp(nativeStacked, {
    raw: { width: NATIVE_SIZE, height: nativeStripHeight, channels: 4 },
  });
  if (hasPaletteTransform(palette)) nativePipeline = applyPalette(nativePipeline, palette);
  if (bg) nativePipeline = nativePipeline.flatten({ background: bg });
  const tintedStacked = hasPaletteTransform(palette) || bg
    ? await nativePipeline.raw().toBuffer()
    : nativeStacked;
  const tintedChannels = bg ? 3 : 4;

  const targetStripHeight = size * LOOP_LENGTH;
  const targetStripped =
    size === NATIVE_SIZE
      ? tintedStacked
      : await sharp(tintedStacked, {
          raw: { width: NATIVE_SIZE, height: nativeStripHeight, channels: tintedChannels },
        })
          .resize(size, targetStripHeight, { kernel: sharp.kernel.nearest })
          .raw()
          .toBuffer();

  const delay = Math.max(20, Math.round(FRAME_MS / speed));
  const delays = Array.from({ length: LOOP_LENGTH }, () => delay);

  const pipeline = sharp(targetStripped, {
    raw: {
      width: size,
      height: targetStripHeight,
      channels: tintedChannels,
      pageHeight: size,
    } as sharp.CreateRaw,
  });

  if (format === "webp") {
    // Animated WebP: alpha preserved, smaller than GIF, better quality.
    return pipeline
      .webp({ delay: delays, loop: 0, lossless: true, effort: 6 })
      .toBuffer();
  }

  // effort: 10 maxes palette optimization — slower encode, smaller file.
  // Immutable cached URL means render happens once per unique URL, then
  // the CDN serves forever. Worth the extra ms at encode time.
  return pipeline.gif({ delay: delays, loop: 0, effort: 10 }).toBuffer();
}
