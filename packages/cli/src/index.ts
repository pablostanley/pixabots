import { writeFile } from "node:fs/promises";
import { randomId, isValidId, resolveId } from "@pixabots/core";

const DEFAULT_ORIGIN = "https://pixabots.com";
const ORIGIN = process.env.PIXABOTS_ORIGIN ?? DEFAULT_ORIGIN;
const GRID = 32;

type RGBA = { r: number; g: number; b: number; a: number };

function printHelp() {
  console.log(`pixabots — print and download Pixabots from your terminal

Usage:
  pixabots                      Print a random pixabot
  pixabots <id>                 Print a specific pixabot (4-char base36 ID)
  pixabots <id> --info          Print metadata for an ID
  pixabots <id> --save <file>   Download PNG to <file>
  pixabots random --json        Print random pixabot as JSON
  pixabots --help               Show this help

Env:
  PIXABOTS_ORIGIN               Override the API host (default ${DEFAULT_ORIGIN})
`);
}

function hexToRgba(hex: string, alpha: number): RGBA {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b, a: alpha };
}

function parseSvg(svg: string): RGBA[][] {
  const grid: RGBA[][] = Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => ({ r: 0, g: 0, b: 0, a: 0 }))
  );
  const rectRe = /<rect\s+x="(\d+)"\s+y="(\d+)"\s+width="1"\s+height="1"\s+fill="(#[0-9a-fA-F]{6})"(?:\s+fill-opacity="([0-9.]+)")?\s*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = rectRe.exec(svg)) !== null) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    const hex = m[3];
    const alpha = m[4] ? Number(m[4]) : 1;
    if (x >= 0 && x < GRID && y >= 0 && y < GRID) {
      grid[y][x] = hexToRgba(hex, alpha);
    }
  }
  return grid;
}

function blend(fg: RGBA, bgR = 0, bgG = 0, bgB = 0): { r: number; g: number; b: number } {
  if (fg.a === 0) return { r: bgR, g: bgG, b: bgB };
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bgR * (1 - a)),
    g: Math.round(fg.g * a + bgG * (1 - a)),
    b: Math.round(fg.b * a + bgB * (1 - a)),
  };
}

function renderAnsi(grid: RGBA[][]): string {
  // Two pixels per terminal row via upper-half block ▀.
  // foreground = top pixel, background = bottom pixel.
  const lines: string[] = [];
  for (let y = 0; y < GRID; y += 2) {
    let line = "";
    for (let x = 0; x < GRID; x++) {
      const top = grid[y][x];
      const bot = grid[y + 1] ? grid[y + 1][x] : { r: 0, g: 0, b: 0, a: 0 };
      const topTransparent = top.a === 0;
      const botTransparent = bot.a === 0;
      if (topTransparent && botTransparent) {
        line += "\x1b[0m  ";
        continue;
      }
      const fg = topTransparent ? { r: 0, g: 0, b: 0 } : blend(top);
      const bg = botTransparent ? null : blend(bot);
      if (topTransparent && bg) {
        // only bottom — use background color as bg, space foreground
        line += `\x1b[48;2;${bg.r};${bg.g};${bg.b}m \x1b[0m`;
      } else if (!topTransparent && !bg) {
        // only top — ▀ with fg color, no bg
        line += `\x1b[38;2;${fg.r};${fg.g};${fg.b}m▀\x1b[0m`;
      } else if (!topTransparent && bg) {
        line += `\x1b[38;2;${fg.r};${fg.g};${fg.b};48;2;${bg.r};${bg.g};${bg.b}m▀\x1b[0m`;
      } else {
        line += "\x1b[0m ";
      }
    }
    lines.push(line);
  }
  return lines.join("\n");
}

async function fetchSvg(id: string): Promise<string> {
  const res = await fetch(`${ORIGIN}/api/pixabot/${id}?format=svg&size=32`);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return await res.text();
}

async function fetchJson(id: string): Promise<unknown> {
  const res = await fetch(`${ORIGIN}/api/pixabot/${id}?format=json`);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return await res.json();
}

async function downloadPng(id: string, path: string, size = 480): Promise<void> {
  const res = await fetch(`${ORIGIN}/api/pixabot/${id}?size=${size}`);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path, buf);
}

async function printBot(id: string) {
  const svg = await fetchSvg(id);
  const grid = parseSvg(svg);
  const art = renderAnsi(grid);
  const parts = resolveId(id);
  process.stdout.write(art + "\n");
  console.log();
  console.log(`  \x1b[1m${id}\x1b[0m`);
  console.log(
    `  ${parts.eyes} · ${parts.heads} · ${parts.body} · ${parts.top}`
  );
  console.log(`  ${ORIGIN}/bot/${id}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const positional = args.filter((a) => !a.startsWith("--"));
  let id = positional[0];

  if (!id || id === "random") id = randomId();

  if (!isValidId(id)) {
    console.error(`Invalid pixabot ID: ${id}`);
    process.exit(1);
  }

  if (flags.has("--json")) {
    const data = await fetchJson(id);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (flags.has("--info")) {
    const parts = resolveId(id);
    console.log(`${id}`);
    console.log(`face:  ${parts.eyes}`);
    console.log(`heads: ${parts.heads}`);
    console.log(`body:  ${parts.body}`);
    console.log(`top:   ${parts.top}`);
    console.log(`url:   ${ORIGIN}/bot/${id}`);
    return;
  }

  if (flags.has("--save")) {
    const saveIdx = args.indexOf("--save");
    const file = args[saveIdx + 1];
    if (!file || file.startsWith("--")) {
      console.error("--save requires a filename");
      process.exit(1);
    }
    await downloadPng(id, file);
    console.log(`Saved ${id} → ${file}`);
    return;
  }

  await printBot(id);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
