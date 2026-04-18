import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidId, decode, PARTS } from "@pixabots/core";
import { SITE_URL } from "@/lib/constants";
import { PixelIcon } from "@/components/ui/pixel-icon";

function getParts(id: string) {
  const combo = decode(id);
  return {
    eyes: PARTS.eyes[combo.eyes].name,
    heads: PARTS.heads[combo.heads].name,
    body: PARTS.body[combo.body].name,
    top: PARTS.top[combo.top].name,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isValidId(id)) return { title: "Not found" };

  const parts = getParts(id);
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

  const parts = getParts(id);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
      <div className="border border-border p-3 w-full max-w-[504px]">
        <img
          src={`/api/pixabot/${id}?size=480&animated=true`}
          alt={`Pixabot ${id}`}
          width={480}
          height={480}
          className="block w-full h-auto"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      <div className="flex flex-col gap-3 w-full max-w-[504px]">
        <h1 className="text-3xl font-bold">
          <span className="font-mono">{id}</span>
        </h1>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">face</dt>
          <dd>{parts.eyes}</dd>
          <dt className="text-muted-foreground">heads</dt>
          <dd>{parts.heads}</dd>
          <dt className="text-muted-foreground">body</dt>
          <dd>{parts.body}</dd>
          <dt className="text-muted-foreground">top</dt>
          <dd>{parts.top}</dd>
        </dl>

        <div className="flex flex-wrap gap-2 mt-2 text-sm">
          <Link
            href={`/?id=${id}`}
            className="flex items-center gap-2 px-3 py-2 border border-border hover:bg-muted transition-colors"
          >
            <PixelIcon name="shuffle" className="size-4" />
            Open in creator
          </Link>
          <a
            href={`/api/pixabot/${id}?size=960`}
            download={`pixabot-${id}.png`}
            className="flex items-center gap-2 px-3 py-2 border border-border hover:bg-muted transition-colors"
          >
            <PixelIcon name="download" className="size-4" />
            Download PNG
          </a>
          <a
            href={`/api/pixabot/${id}?animated=true&size=480`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 border border-border hover:bg-muted transition-colors"
          >
            <PixelIcon name="play" className="size-4" />
            Animated GIF
          </a>
        </div>
      </div>
    </main>
  );
}
