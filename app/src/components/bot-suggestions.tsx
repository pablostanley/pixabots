import Link from "next/link";
import { CATEGORY_ORDER, PARTS, decode, encode, type PartCategory } from "@pixabots/core";
import { withPalette } from "@/lib/palette";

function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic 4 variants, each differing from `id` by exactly one part.
 * Uses a hashed seed so the same id always yields the same suggestions —
 * means /api/pixabot/{vid} responses stay cache-hit-friendly.
 */
function buildVariants(id: string, count = 4): string[] {
  const base = decode(id);
  const rng = mulberry32(seedFromId(id));
  const seen = new Set<string>([id]);
  const out: string[] = [];
  for (let guard = 0; out.length < count && guard < count * 12; guard++) {
    const cat: PartCategory = CATEGORY_ORDER[Math.floor(rng() * CATEGORY_ORDER.length)];
    const max = PARTS[cat].length;
    if (max < 2) continue;
    const current = base[cat];
    let next = Math.floor(rng() * max);
    if (next === current) next = (next + 1) % max;
    const vid = encode({ ...base, [cat]: next });
    if (seen.has(vid)) continue;
    seen.add(vid);
    out.push(vid);
  }
  return out;
}

export function BotSuggestions({
  id,
  hue,
  saturate,
}: {
  id: string;
  hue?: number;
  saturate?: number;
}) {
  const variants = buildVariants(id);
  if (variants.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        You might also like
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {variants.map((vid) => (
          <Link
            key={vid}
            href={withPalette(`/bot/${vid}`, { hue, saturate })}
            aria-label={`Pixabot ${vid}`}
            className="group block border border-border hover:border-foreground transition-colors"
          >
            <img
              src={withPalette(`/api/pixabot/${vid}?size=240`, { hue, saturate })}
              alt=""
              width={240}
              height={240}
              className="block w-full aspect-square"
              style={{ imageRendering: "pixelated" }}
              loading="lazy"
            />
            <div
              aria-hidden="true"
              className="px-1 py-0.5 font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors"
            >
              {vid}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
