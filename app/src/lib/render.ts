import sharp from "sharp";
import path from "path";
import {
  PARTS,
  LAYER_ORDER,
  ANIM_FRAMES,
  FRAME_MS,
  type PixabotCombo,
  type AnimFrame,
} from "@pixabots/core";

const NATIVE_SIZE = 32;
const ANIM_PAD = 4;
const PARTS_DIR = path.join(process.cwd(), "public", "parts");
const FRAME_DELAYS = ANIM_FRAMES.map(() => FRAME_MS);
const ANIM_MAX_SIZE = 480;

export class RenderError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

async function loadLayers(combo: PixabotCombo) {
  const entries = await Promise.all(
    LAYER_ORDER.map(async (category) => {
      const part = PARTS[category][combo[category]];
      if (!part) throw new RenderError(`Unknown part index ${combo[category]} for "${category}"`, 400);
      const filePath = path.join(PARTS_DIR, part.path);
      try {
        const buf = await sharp(filePath)
          .resize(NATIVE_SIZE, NATIVE_SIZE, { kernel: sharp.kernel.nearest })
          .png()
          .toBuffer();
        return [category, buf] as const;
      } catch {
        throw new RenderError(`Sprite not found: ${part.path}`, 404);
      }
    })
  );
  return Object.fromEntries(entries) as Record<string, Buffer>;
}

/** Render a pixabot combo to a PNG buffer at the specified size. */
export async function renderPixabot(
  combo: PixabotCombo,
  size: number = NATIVE_SIZE
): Promise<Buffer> {
  const layers = await loadLayers(combo);
  const composites = LAYER_ORDER.map((cat) => ({
    input: layers[cat],
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

  if (size === NATIVE_SIZE) {
    return base.toBuffer();
  }

  const nativeBuffer = await base.toBuffer();
  return sharp(nativeBuffer)
    .resize(size, size, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
}

async function renderFrame(
  layers: Record<string, Buffer>,
  offsets: AnimFrame,
  size: number
): Promise<Buffer> {
  const composites = LAYER_ORDER.map((cat) => ({
    input: layers[cat],
    left: 0,
    top: Math.round(offsets[cat as keyof AnimFrame]),
  }));

  // Two-step pipeline: sharp can't chain extract→resize on a created canvas
  const native = await sharp({
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

  return sharp(native)
    .resize(size, size, { kernel: sharp.kernel.nearest })
    .raw()
    .toBuffer();
}

/** Render an animated GIF of the bounce animation. */
export async function renderAnimatedPixabot(
  combo: PixabotCombo,
  size: number = NATIVE_SIZE
): Promise<Buffer> {
  const cappedSize = Math.min(size, ANIM_MAX_SIZE);
  const layers = await loadLayers(combo);

  const frameBuffers = await Promise.all(
    ANIM_FRAMES.map((offsets) => renderFrame(layers, offsets, cappedSize))
  );

  const stacked = Buffer.concat(frameBuffers);
  const totalHeight = cappedSize * ANIM_FRAMES.length;

  return sharp(stacked, {
    raw: {
      width: cappedSize,
      height: totalHeight,
      channels: 4,
      pageHeight: cappedSize,
    } as sharp.CreateRaw,
  })
    .gif({ delay: FRAME_DELAYS, loop: 0 })
    .toBuffer();
}
