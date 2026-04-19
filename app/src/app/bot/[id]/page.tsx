import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidId, resolveId } from "@pixabots/core";
import { SITE_URL } from "@/lib/constants";
import { BotDetail } from "@/components/bot-detail";
import { BotEmbed } from "@/components/bot-embed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isValidId(id)) return { title: "Not found" };

  const parts = resolveId(id);
  const partsLabel = `${parts.eyes} · ${parts.heads} · ${parts.body} · ${parts.top}`;
  const title = `Pixabot ${id}`;
  const description = `Pixel character #${id} — ${partsLabel}`;
  const ogUrl = `${SITE_URL}/api/og?type=single&id=${id}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(partsLabel)}`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/bot/${id}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}/bot/${id}`,
      siteName: "Pixabots",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
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
  searchParams: Promise<{ hue?: string; saturate?: string }>;
}) {
  const { id } = await params;
  if (!isValidId(id)) notFound();
  const { hue: hueParam, saturate: satParam } = await searchParams;
  const hue = parseHue(hueParam);
  const saturate = parseSaturate(satParam);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[504px] flex flex-col gap-6">
        <BotDetail id={id} hue={hue} saturate={saturate} />
        <BotEmbed id={id} />
      </div>
    </main>
  );
}
