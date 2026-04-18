import sharp from "/Users/pablostanley/Dropbox/pixabots/app/node_modules/sharp/lib/index.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PARTS, LAYER_ORDER, decode } from "/Users/pablostanley/Dropbox/pixabots/app/node_modules/@pixabots/core/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PARTS_DIR = path.join(ROOT, "app", "public", "parts");
const APP_DIR = path.join(ROOT, "app", "src", "app");

const ICON_ID = "2156";
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

async function main() {
  const icon = await renderBot(ICON_ID, 32);
  await sharp(icon).toFile(path.join(APP_DIR, "icon.png"));
  console.log("→ app/src/app/icon.png (32×32)");

  const apple = await renderBot(ICON_ID, 180);
  await sharp(apple).toFile(path.join(APP_DIR, "apple-icon.png"));
  console.log("→ app/src/app/apple-icon.png (180×180)");
}

main().catch((e) => { console.error(e); process.exit(1); });
