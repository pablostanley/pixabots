"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { randomId } from "@pixabots/core";
import { PixelIcon } from "@/components/ui/pixel-icon";

const BATCH_SIZE = 60;
const FEATURED_EVERY = 8;

interface BotCell {
  id: string;
  featured: boolean;
}

function generateBatch(count: number): BotCell[] {
  return Array.from({ length: count }, (_, i) => ({
    id: randomId(),
    featured: i % FEATURED_EVERY === 0,
  }));
}

function BotCard({ bot }: { bot: BotCell }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const size = bot.featured ? 480 : 240;
  const animatedSrc = `/api/pixabot/${bot.id}?size=${size}&animated=true`;
  const staticSrc = `/api/pixabot/${bot.id}?size=${size}`;

  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?id=${bot.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const link = document.createElement("a");
    link.href = `/api/pixabot/${bot.id}?size=960`;
    link.download = `pixabot-${bot.id}.png`;
    link.click();
  };

  return (
    <div
      className={`group relative bg-card border border-border overflow-hidden aspect-square ${
        bot.featured ? "col-span-2 row-span-2" : ""
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/?id=${bot.id}`}>
        <img
          src={hovered ? staticSrc : animatedSrc}
          alt={`Pixabot ${bot.id}`}
          className="w-full h-full object-cover"
          style={{ imageRendering: "pixelated" }}
          loading="lazy"
        />
      </Link>

      {/* Overlay — bottom bar on mobile, full cover on hover for desktop */}
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 bg-background/90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end sm:justify-center gap-1 p-1.5 sm:p-2 sm:pointer-events-none sm:group-hover:pointer-events-auto">
        <span className="hidden sm:block font-mono text-sm text-foreground">{bot.id}</span>
        <div className="flex gap-1">
          <button
            onClick={copy}
            className="flex items-center gap-1 px-1.5 py-0.5 text-xs border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
            title="Copy share URL"
          >
            <PixelIcon name={copied ? "check" : "copy"} className="size-3" />
            <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
          </button>
          <button
            onClick={download}
            className="flex items-center gap-1 px-1.5 py-0.5 text-xs border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
            title="Download PNG"
          >
            <PixelIcon name="download" className="size-3" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <Link
            href={`/?id=${bot.id}`}
            className="flex items-center gap-1 px-1.5 py-0.5 text-xs border border-border bg-card hover:bg-muted transition-colors"
            title="Open in creator"
          >
            <PixelIcon name="shuffle" className="size-3" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [batches, setBatches] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const bots = useMemo(
    () => Array.from({ length: batches }, () => generateBatch(BATCH_SIZE)).flat(),
    [batches]
  );

  const loadMore = useCallback(() => setBatches((b) => b + 1), []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <main className="flex-1 p-2 sm:p-4">
      <div
        className="grid gap-1 sm:gap-2"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gridAutoFlow: "dense",
        }}
      >
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-1" />
    </main>
  );
}
