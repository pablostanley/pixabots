import type { Metadata } from "next";
import { isValidId, resolveId, seededId } from "@pixabots/core";
import { Creator } from "./creator";
import { SpritePreload } from "@/components/sprite-preload";
import { SITE_URL } from "@/lib/constants";

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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; seed?: string; hue?: string; saturate?: string }>;
}): Promise<Metadata> {
  const { id, seed, hue: hueRaw, saturate: satRaw } = await searchParams;
  const resolved = resolveInitialId(id, seed);
  if (!resolved || !isValidId(resolved)) return {};

  const parts = resolveId(resolved);
  const partsLabel = `${parts.eyes} · ${parts.heads} · ${parts.body} · ${parts.top}`;
  const title = `Pixabot ${resolved}`;
  const description = `Customize pixel character #${resolved} — ${partsLabel}`;

  const canonicalQs = new URLSearchParams();
  canonicalQs.set("id", resolved);
  if (hueRaw) canonicalQs.set("hue", hueRaw);
  if (satRaw) canonicalQs.set("saturate", satRaw);
  const canonical = `${SITE_URL}/?${canonicalQs.toString()}`;

  let ogQuery = `type=single&id=${resolved}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(partsLabel)}`;
  if (hueRaw) ogQuery += `&hue=${encodeURIComponent(hueRaw)}`;
  if (satRaw) ogQuery += `&saturate=${encodeURIComponent(satRaw)}`;
  const ogUrl = `${SITE_URL}/api/og?${ogQuery}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "Pixabots",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: ogUrl, alt: title }],
      site: "@pablostanley",
      creator: "@pablostanley",
    },
  };
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
