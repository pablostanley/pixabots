import { writeFile } from "node:fs/promises";
import { randomId, isValidId, resolveId } from "@pixabots/core";

const DEFAULT_ORIGIN = "https://pixabots.com";
const ORIGIN = process.env.PIXABOTS_ORIGIN ?? DEFAULT_ORIGIN;
const GRID = 32;

type RGBA = { r: number; g: number; b: number; a: number };

function printHelp() {
  console.log(`pixabots — print and download Pixabots from your terminal

Usage:
  pixabots                         Print a random pixabot
  pixabots <id>                    Print a specific pixabot (4-char base36 ID)
  pixabots <id> --info             Print metadata for an ID
  pixabots <id> --save <file>      Download PNG to <file>
  pixabots random --json           Print random pixabot as JSON
  pixabots <id> --hue <deg>        Apply hue rotation (0–359)
  pixabots <id> --saturate <mult>  Apply saturation multiplier (0–4)
  pixabots --help                  Show this help

Env:
  PIXABOTS_ORIGIN                  Override the API host (default ${DEFAULT_ORIGIN})
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

function paletteSuffix(hue?: number, saturate?: number): string {
  const parts: string[] = [];
  if (hue !== undefined && hue !== 0) parts.push(`hue=${hue}`);
  if (saturate !== undefined && saturate !== 1) parts.push(`saturate=${saturate}`);
  return parts.length ? `&${parts.join("&")}` : "";
}

async function fetchSvg(id: string): Promise<string> {
  // SVG is not affected by hue/saturate server-side — palette applies to
  // raster outputs only. Terminal render shows base colors.
  const res = await fetch(`${ORIGIN}/api/pixabot/${id}?format=svg&size=32`);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return await res.text();
}

async function fetchJson(id: string): Promise<unknown> {
  const res = await fetch(`${ORIGIN}/api/pixabot/${id}?format=json`);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return await res.json();
}

async function downloadPng(id: string, path: string, size = 480, hue?: number, saturate?: number): Promise<void> {
  const res = await fetch(`${ORIGIN}/api/pixabot/${id}?size=${size}${paletteSuffix(hue, saturate)}`);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path, buf);
}

async function printBot(id: string, hue?: number, saturate?: number) {
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
  if (hue !== undefined || saturate !== undefined) {
    console.log(`  (palette applies to --save PNG, not terminal render)`);
  }
  const urlQs = paletteSuffix(hue, saturate).replace(/^&/, "?");
  console.log(`  ${ORIGIN}/bot/${id}${urlQs}`);
}

function valueFlag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : undefined;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const positional = args.filter((a, i) => {
    if (a.startsWith("--")) return false;
    const prev = args[i - 1];
    return !prev || !prev.startsWith("--");
  });
  let id = positional[0];

  if (!id || id === "random") id = randomId();

  if (!isValidId(id)) {
    console.error(`Invalid pixabot ID: ${id}`);
    process.exit(1);
  }

  const flags = new Set(args.filter((a) => a.startsWith("--")));

  let hue: number | undefined;
  let saturate: number | undefined;
  const hueVal = valueFlag(args, "--hue");
  if (hueVal !== undefined) {
    const n = Number(hueVal);
    if (!Number.isFinite(n)) {
      console.error("--hue must be a number");
      process.exit(1);
    }
    hue = ((Math.round(n) % 360) + 360) % 360;
  }
  const satVal = valueFlag(args, "--saturate");
  if (satVal !== undefined) {
    const n = Number(satVal);
    if (!Number.isFinite(n) || n < 0 || n > 4) {
      console.error("--saturate must be a number between 0 and 4");
      process.exit(1);
    }
    saturate = n;
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
    if (hue !== undefined) console.log(`hue:   ${hue}°`);
    if (saturate !== undefined) console.log(`sat:   ${saturate}`);
    const urlQs = paletteSuffix(hue, saturate).replace(/^&/, "?");
    console.log(`url:   ${ORIGIN}/bot/${id}${urlQs}`);
    return;
  }

  if (flags.has("--save")) {
    const file = valueFlag(args, "--save");
    if (!file) {
      console.error("--save requires a filename");
      process.exit(1);
    }
    await downloadPng(id, file, 480, hue, saturate);
    console.log(`Saved ${id} → ${file}`);
    return;
  }

  await printBot(id, hue, saturate);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
