import sharp from "sharp";
import path from "path";
import { PARTS, LAYER_ORDER, type PixabotCombo } from "@pixabots/core";

const NATIVE_SIZE = 32;
const PARTS_DIR = path.join(process.cwd(), "public", "parts");

/** Render a pixabot combo to a PNG buffer at the specified size. */
export async function renderPixabot(
  combo: PixabotCombo,
  size: number = NATIVE_SIZE
): Promise<Buffer> {
  const composites: sharp.OverlayOptions[] = [];

  for (const category of LAYER_ORDER) {
    const part = PARTS[category][combo[category]];
    const filePath = path.join(PARTS_DIR, part.path);
    const buf = await sharp(filePath)
      .resize(NATIVE_SIZE, NATIVE_SIZE, { kernel: sharp.kernel.nearest })
      .toBuffer();
    composites.push({ input: buf, left: 0, top: 0 });
  }

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

  // Scale up with nearest-neighbor for pixel-perfect rendering
  const nativeBuffer = await base.toBuffer();
  return sharp(nativeBuffer)
    .resize(size, size, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
}
