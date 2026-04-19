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
  searchParams: Promise<{ size?: string; animated?: string; bg?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isValidId(id)) notFound();

  const size = Number(sp.size) || 240;
  const safeSize = Math.max(32, Math.min(1920, Math.round(size)));
  const animated = sp.animated !== "false";
  const bg = sp.bg ? `#${sp.bg.replace(/^#/, "")}` : undefined;
  const src = `/api/pixabot/${id}?size=${safeSize}${animated ? "&animated=true" : ""}`;
  const staticSrc = `/api/pixabot/${id}?size=${safeSize}`;

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
