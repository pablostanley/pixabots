import sharp from "sharp";
import { readdir } from "fs/promises";
import path from "path";

const ROOT = "/Users/pablostanley/Dropbox/pixabots";
const ART = path.join(ROOT, "art/png");
const OUT = path.join(ROOT, "marketing");

// Both generations: gen2 = current folders, gen1 = -001 folders
const GENS = {
  gen1: { body: "body-001", eyes: "eyes-001", heads: "heads-001", top: "top-001" },
  gen2: { body: "body", eyes: "eyes", heads: "heads", top: "top" },
};

// Layer draw order (bottom to top): top, body, heads, eyes/face
const LAYERS = ["top", "body", "heads", "eyes"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Cache file listings per folder
const fileCache = {};
async function listFiles(folder) {
  if (!fileCache[folder]) {
    const full = path.join(ART, folder);
    const files = (await readdir(full)).filter((f) => f.endsWith(".png"));
    fileCache[folder] = files;
  }
  return fileCache[folder];
}

// Build one random pixabot as a 32x32 sharp buffer (transparent PNG)
async function buildPixabot() {
  // Pick a random generation for each layer independently
  const composites = [];
  for (const layer of LAYERS) {
    const gen = pick(["gen1", "gen2"]);
    const folder = GENS[gen][layer];
    const files = await listFiles(folder);
    const file = pick(files);
    const buf = await sharp(path.join(ART, folder, file))
      .resize(32, 32, { kernel: sharp.kernel.nearest })
      .ensureBanner
      ? sharp(path.join(ART, folder, file)).resize(32, 32, { kernel: sharp.kernel.nearest }).toBuffer()
      : await sharp(path.join(ART, folder, file)).resize(32, 32, { kernel: sharp.kernel.nearest }).toBuffer();
    composites.push({ input: buf, left: 0, top: 0 });
  }

  // Start with transparent 32x32 canvas
  return sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

// Create a grid image
async function createGridImage(cols, rows, totalWidth, outputPath) {
  const padding = 60;
  const gap = 40;
  const innerWidth = totalWidth - padding * 2;
  const cellSize = Math.floor((innerWidth - (cols - 1) * gap) / cols);
  const innerHeight = rows * cellSize + (rows - 1) * gap;
  const totalHeight = innerHeight + padding * 2;

  // Build all pixabots
  const count = cols * rows;
  const bots = await Promise.all(Array.from({ length: count }, () => buildPixabot()));

  // Scale each bot up to cellSize x cellSize with nearest-neighbor
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

// Main
async function main() {
  // Create 5 grid images (4x2)
  console.log("Generating 5 grid images (4x2)...");
  for (let i = 1; i <= 5; i++) {
    await createGridImage(4, 2, 1920, path.join(OUT, `grid-4x2-${i}.png`));
  }

  // Create 3 large grid images (12x4)
  console.log("Generating 3 large grid images (12x4)...");
  for (let i = 1; i <= 3; i++) {
    await createGridImage(12, 4, 1920, path.join(OUT, `grid-12x4-${i}.png`));
  }

  console.log("\nAll images created in marketing/");
}

main().catch(console.error);
