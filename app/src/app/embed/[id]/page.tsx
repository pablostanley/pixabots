import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidId } from "@pixabots/core";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    size?: string;
    animated?: string;
    bg?: string;
    hue?: string;
    saturate?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isValidId(id)) notFound();

  const size = Number(sp.size) || 240;
  const safeSize = Math.max(32, Math.min(1920, Math.round(size)));
  const animated = sp.animated !== "false";
  const bg = sp.bg ? `#${sp.bg.replace(/^#/, "")}` : undefined;

  const palette: string[] = [];
  if (sp.hue) {
    const n = Number(sp.hue);
    if (Number.isFinite(n)) palette.push(`hue=${((Math.round(n) % 360) + 360) % 360}`);
  }
  if (sp.saturate) {
    const n = Number(sp.saturate);
    if (Number.isFinite(n)) palette.push(`saturate=${Math.max(0, Math.min(4, n))}`);
  }
  const pal = palette.length ? `&${palette.join("&")}` : "";

  const src = `/api/pixabot/${id}?size=${safeSize}${animated ? "&animated=true" : ""}${pal}`;
  const staticSrc = `/api/pixabot/${id}?size=${safeSize}${pal}`;

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: bg ?? "transparent",
      }}
    >
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={staticSrc} />
        <img
          src={src}
          alt={`Pixabot ${id}`}
          width={safeSize}
          height={safeSize}
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "100%",
            height: "auto",
            imageRendering: "pixelated",
          }}
        />
      </picture>
    </main>
  );
}
