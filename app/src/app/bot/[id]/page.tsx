import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidId, resolveId } from "@pixabots/core";
import { SITE_URL } from "@/lib/constants";
import { BotDetail } from "@/components/bot-detail";

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

export default async function BotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidId(id)) notFound();

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[504px]">
        <BotDetail id={id} />
      </div>
    </main>
  );
}
