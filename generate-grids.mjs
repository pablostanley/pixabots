import sharp from "sharp";
import { readdir } from "fs/promises";
import path from "path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const ART = path.join(ROOT, "art/png");
const OUT = path.join(ROOT, "marketing");

const LAYERS = ["top", "body", "heads", "eyes"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const fileCache = {};
async function listFiles(folder) {
  if (!fileCache[folder]) {
    const full = path.join(ART, folder);
    const files = (await readdir(full)).filter((f) => f.endsWith(".png"));
    fileCache[folder] = files;
  }
  return fileCache[folder];
}

async function buildPixabot() {
  const composites = [];
  for (const layer of LAYERS) {
    const files = await listFiles(layer);
    const file = pick(files);
    const buf = await sharp(path.join(ART, layer, file))
      .resize(32, 32, { kernel: sharp.kernel.nearest })
      .toBuffer();
    composites.push({ input: buf, left: 0, top: 0 });
  }

  return sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function createGridImage(cols, rows, totalWidth, outputPath) {
  const padding = 60;
  const gap = 40;
  const innerWidth = totalWidth - padding * 2;
  const cellSize = Math.floor((innerWidth - (cols - 1) * gap) / cols);
  const innerHeight = rows * cellSize + (rows - 1) * gap;
  const totalHeight = innerHeight + padding * 2;

  const count = cols * rows;
  const bots = await Promise.all(Array.from({ length: count }, () => buildPixabot()));

  const composites = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + col * (cellSize + gap);
    const y = padding + row * (cellSize + gap);

    const scaled = await sharp(bots[i])
      .resize(cellSize, cellSize, { kernel: sharp.kernel.nearest })
      .png()
      .toBuffer();

    composites.push({ input: scaled, left: x, top: y });
  }

  await sharp({
    create: { width: totalWidth, height: totalHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);

  console.log(`Created: ${outputPath} (${totalWidth}x${totalHeight})`);
}

async function main() {
  console.log("Generating 5 grid images (4x2)...");
  for (let i = 1; i <= 5; i++) {
    await createGridImage(4, 2, 1920, path.join(OUT, `grid-4x2-${i}.png`));
  }

  console.log("Generating 3 large grid images (12x4)...");
  for (let i = 1; i <= 3; i++) {
    await createGridImage(12, 4, 1920, path.join(OUT, `grid-12x4-${i}.png`));
  }

  console.log("\nAll images created in marketing/");
}

main().catch(console.error);
