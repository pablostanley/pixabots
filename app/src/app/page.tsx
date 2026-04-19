import { seededId } from "@pixabots/core";
import { Creator } from "./creator";
import { SpritePreload } from "@/components/sprite-preload";

function parseHue(v: string | undefined): number {
  if (typeof v !== "string") return 0;
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return ((Math.round(n) % 360) + 360) % 360;
}

function parseSaturate(v: string | undefined): number {
  if (typeof v !== "string") return 1;
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(4, n));
}

const MAX_SEED_LEN = 80;

/** Explicit `id` wins; otherwise a `seed` string hashes to a deterministic id. */
function resolveInitialId(id?: string, seed?: string): string | null {
  if (typeof id === "string") return id;
  if (typeof seed === "string" && seed.length > 0) {
    return seededId(seed.slice(0, MAX_SEED_LEN));
  }
  return null;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; seed?: string; hue?: string; saturate?: string }>;
}) {
  const { id, seed, hue, saturate } = await searchParams;
  return (
    <>
      <SpritePreload />
      <Creator
        initialId={resolveInitialId(id, seed)}
        initialHue={parseHue(hue)}
        initialSaturate={parseSaturate(saturate)}
      />
    </>
  );
}
