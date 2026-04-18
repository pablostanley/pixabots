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
import { PARTS_DIR } from "@/lib/paths";

const NATIVE_SIZE = 32;
const ANIM_PAD = 4;

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
  bodyTop: Buffer,
  bodyBottom: Buffer,
  offsets: AnimFrame,
  size: number
): Promise<Buffer> {
  const composites: sharp.OverlayOptions[] = [];

  // Feet-stay-planted: body bottom row fixed at y=31, top 31 rows shifted.
  // Matches client-side canvas logic in page.tsx.
  for (const cat of LAYER_ORDER) {
    const off = Math.round(offsets[cat as keyof AnimFrame]);
    if (cat === "body" && off > 0) {
      composites.push({ input: bodyTop, left: 0, top: off });
      composites.push({ input: bodyBottom, left: 0, top: NATIVE_SIZE - 1 });
    } else {
      composites.push({ input: layers[cat], left: 0, top: off });
    }
  }

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
  size: number = NATIVE_SIZE,
  speed: number = 1
): Promise<Buffer> {
  const layers = await loadLayers(combo);

  // Precompute body top/bottom once; reused across all frames with body offset > 0
  const [bodyTop, bodyBottom] = await Promise.all([
    sharp(layers.body)
      .extract({ left: 0, top: 0, width: NATIVE_SIZE, height: NATIVE_SIZE - 1 })
      .png()
      .toBuffer(),
    sharp(layers.body)
      .extract({ left: 0, top: NATIVE_SIZE - 1, width: NATIVE_SIZE, height: 1 })
      .png()
      .toBuffer(),
  ]);
  const frameBuffers = await Promise.all(
    ANIM_FRAMES.map((offsets) => renderFrame(layers, bodyTop, bodyBottom, offsets, size))
  );

  const stacked = Buffer.concat(frameBuffers);
  const totalHeight = size * ANIM_FRAMES.length;
  const delay = Math.max(20, Math.round(FRAME_MS / speed));
  const delays = ANIM_FRAMES.map(() => delay);

  return sharp(stacked, {
    raw: {
      width: size,
      height: totalHeight,
      channels: 4,
      pageHeight: size,
    } as sharp.CreateRaw,
  })
    .gif({ delay: delays, loop: 0 })
    .toBuffer();
}
