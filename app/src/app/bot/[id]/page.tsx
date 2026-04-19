import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidId, resolveId } from "@pixabots/core";
import { SITE_URL } from "@/lib/constants";
import { BotDetail } from "@/components/bot-detail";
import { BotEmbed } from "@/components/bot-embed";
import { BotSuggestions } from "@/components/bot-suggestions";
import { normalizeHex } from "@/lib/palette";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hue?: string; saturate?: string; bg?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isValidId(id)) return { title: "Not found" };

  const { hue: hueRaw, saturate: satRaw, bg: bgRaw } = await searchParams;
  const bgNorm = bgRaw ? normalizeHex(bgRaw) : null;
  const parts = resolveId(id);
  const partsLabel = `${parts.eyes} · ${parts.heads} · ${parts.body} · ${parts.top}`;
  const title = `Pixabot ${id}`;
  const description = `Pixel character #${id} — ${partsLabel}`;
  let ogQuery = `type=single&id=${id}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(partsLabel)}`;
  if (hueRaw) ogQuery += `&hue=${encodeURIComponent(hueRaw)}`;
  if (satRaw) ogQuery += `&saturate=${encodeURIComponent(satRaw)}`;
  if (bgNorm) ogQuery += `&bg=${encodeURIComponent(bgNorm)}`;
  const ogUrl = `${SITE_URL}/api/og?${ogQuery}`;

  const canonicalQs = new URLSearchParams();
  if (hueRaw) canonicalQs.set("hue", hueRaw);
  if (satRaw) canonicalQs.set("saturate", satRaw);
  if (bgNorm) canonicalQs.set("bg", bgNorm);
  const canonical = canonicalQs.size
    ? `${SITE_URL}/bot/${id}?${canonicalQs.toString()}`
    : `${SITE_URL}/bot/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
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

function parseHue(v: string | undefined): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return ((Math.round(n) % 360) + 360) % 360;
}
function parseSaturate(v: string | undefined): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(4, n));
}

export default async function BotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hue?: string; saturate?: string; bg?: string }>;
}) {
  const { id } = await params;
  if (!isValidId(id)) notFound();
  const { hue: hueParam, saturate: satParam, bg: bgParam } = await searchParams;
  const hue = parseHue(hueParam);
  const saturate = parseSaturate(satParam);
  const bg = bgParam ? normalizeHex(bgParam) ?? undefined : undefined;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[504px] flex flex-col gap-6">
        <BotDetail id={id} hue={hue} saturate={saturate} bg={bg} />
        <BotSuggestions id={id} hue={hue} saturate={saturate} bg={bg} />
        <BotEmbed id={id} hue={hue} saturate={saturate} bg={bg} />
      </div>
    </main>
  );
}
