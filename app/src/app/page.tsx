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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; hue?: string; saturate?: string }>;
}) {
  const { id, hue, saturate } = await searchParams;
  return (
    <>
      <SpritePreload />
      <Creator
        initialId={typeof id === "string" ? id : null}
        initialHue={parseHue(hue)}
        initialSaturate={parseSaturate(saturate)}
      />
    </>
  );
}
