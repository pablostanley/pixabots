import type { Metadata } from "next";
import Link from "next/link";
import { BotDetail } from "@/components/bot-detail";
import { CompareShuffleButton } from "@/components/compare-shuffle-button";
import { SITE_URL } from "@/lib/constants";
import { parseIdsCsv } from "@/lib/ids";
import { normalizeHex } from "@/lib/palette";

const MAX_IDS = 6;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; hue?: string; saturate?: string; bg?: string }>;
}): Promise<Metadata> {
  const { ids: raw, hue: hueRaw, saturate: satRaw, bg: bgRaw } = await searchParams;
  const ids = parseIdsCsv(raw, MAX_IDS);
  const bgNorm = bgRaw ? normalizeHex(bgRaw) : null;

  const canonicalQs = new URLSearchParams();
  if (ids.length) canonicalQs.set("ids", ids.join(","));
  if (hueRaw) canonicalQs.set("hue", hueRaw);
  if (satRaw) canonicalQs.set("saturate", satRaw);
  if (bgNorm) canonicalQs.set("bg", bgNorm);
  const canonical = canonicalQs.size
    ? `${SITE_URL}/compare?${canonicalQs.toString()}`
    : `${SITE_URL}/compare`;

  if (ids.length === 0) {
    return {
      title: "Compare",
      description: "Compare multiple pixabots side-by-side.",
      alternates: { canonical },
    };
  }

  const title = `Comparing ${ids.length} pixabot${ids.length === 1 ? "" : "s"}`;
  const subtitle = ids.join(" · ");
  const description = `Side-by-side comparison of ${ids.join(", ")}.`;

  let ogQuery = `type=compare&ids=${ids.join(",")}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}`;
  if (hueRaw) ogQuery += `&hue=${encodeURIComponent(hueRaw)}`;
  if (satRaw) ogQuery += `&saturate=${encodeURIComponent(satRaw)}`;
  if (bgNorm) ogQuery += `&bg=${encodeURIComponent(bgNorm)}`;
  const ogUrl = `${SITE_URL}/api/og?${ogQuery}`;

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

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; hue?: string; saturate?: string; bg?: string }>;
}) {
  const { ids: raw, hue: hueRaw, saturate: satRaw, bg: bgRaw } = await searchParams;
  const ids = parseIdsCsv(raw, MAX_IDS);
  const hue = parseHue(hueRaw);
  const saturate = parseSaturate(satRaw);
  const bg = bgRaw ? normalizeHex(bgRaw) ?? undefined : undefined;

  if (ids.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold">Compare pixabots</h1>
        <p className="text-muted-foreground max-w-prose">
          Pass two or more IDs in the URL, e.g.{" "}
          <Link href="/compare?ids=2156,f76a" className="font-mono text-foreground underline">
            /compare?ids=2156,f76a
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Link href="/browse" className="px-3 py-2 border border-border hover:bg-muted text-sm">
            Browse
          </Link>
          <Link href="/favorites" className="px-3 py-2 border border-border hover:bg-muted text-sm">
            Favorites
          </Link>
          <CompareShuffleButton />
        </div>
      </main>
    );
  }

  const colClass =
    ids.length === 1
      ? "grid-cols-1 max-w-[504px]"
      : ids.length === 2
      ? "grid-cols-1 sm:grid-cols-2 max-w-[1040px]"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-[1600px]";

  return (
    <main className="flex-1 p-4 sm:p-6 flex flex-col items-center">
      <header className="w-full max-w-[1600px] flex items-center justify-between mb-4 px-1">
        <h1 className="text-lg font-bold">
          Comparing {ids.length} pixabot{ids.length === 1 ? "" : "s"}
        </h1>
        <div className="flex items-center gap-3">
          <CompareShuffleButton />
          <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground">
            back to browse
          </Link>
        </div>
      </header>
      <div className={`w-full grid gap-6 ${colClass}`}>
        {ids.map((id) => (
          <BotDetail key={id} id={id} hue={hue} saturate={saturate} bg={bg} />
        ))}
      </div>
    </main>
  );
}
