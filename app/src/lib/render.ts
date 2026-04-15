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
const ANIM_PAD = 4; // max Y offset is ~3px, pad canvas to avoid clipping
const PARTS_DIR = path.join(process.cwd(), "public", "parts");

/** Load the 4 layer PNGs for a combo as Sharp buffers. */
async function loadLayers(combo: PixabotCombo) {
  const layers: Record<string, Buffer> = {};
  for (const category of LAYER_ORDER) {
    const part = PARTS[category][combo[category]];
    const filePath = path.join(PARTS_DIR, part.path);
    layers[category] = await sharp(filePath)
      .resize(NATIVE_SIZE, NATIVE_SIZE, { kernel: sharp.kernel.nearest })
      .png()
      .toBuffer();
  }
  return layers;
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

/** Render a single animation frame as raw RGBA at the target size. */
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

  // Composite on a padded canvas, then extract to native size
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

  // Scale up in a separate step for pixel-perfect nearest-neighbor
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
  const layers = await loadLayers(combo);

  const frameBuffers: Buffer[] = [];
  for (const offsets of ANIM_FRAMES) {
    frameBuffers.push(await renderFrame(layers, offsets, size));
  }

  const stacked = Buffer.concat(frameBuffers);
  const totalHeight = size * ANIM_FRAMES.length;

  return sharp(stacked, {
    raw: {
      width: size,
      height: totalHeight,
      channels: 4,
      pages: ANIM_FRAMES.length,
      pageHeight: size,
    } as sharp.CreateRaw,
  })
    .gif({
      delay: Array(ANIM_FRAMES.length).fill(FRAME_MS),
      loop: 0,
    })
    .toBuffer();
}
