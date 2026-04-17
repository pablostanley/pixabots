"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const size = bot.featured ? 480 : 240;
  const animatedSrc = `/api/pixabot/${bot.id}?size=${size}&animated=true`;
  const staticSrc = `/api/pixabot/${bot.id}?size=${size}`;

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?id=${bot.id}`);
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const link = document.createElement("a");
    link.href = `/api/pixabot/${bot.id}?size=960`;
    link.download = `pixabot-${bot.id}.png`;
    link.click();
  };

  return (
    <div
      className={`group bg-card border border-border overflow-hidden ${
        bot.featured ? "sm:col-span-2 sm:row-span-2" : ""
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/?id=${bot.id}`} className="block relative aspect-square">
        <img
          src={animatedSrc}
          alt={`Pixabot ${bot.id}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${hovered ? "opacity-0" : "opacity-100"}`}
          style={{ imageRendering: "pixelated" }}
          loading="lazy"
        />
        <img
          src={staticSrc}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}
          style={{ imageRendering: "pixelated" }}
          loading="lazy"
        />
      </Link>

      <div className="flex items-center gap-1 p-1 sm:max-h-0 sm:overflow-hidden sm:group-hover:max-h-12 sm:group-hover:p-1.5 transition-all duration-200">
        <span className="font-mono text-xs text-muted-foreground mr-auto">{bot.id}</span>
        <button
          onClick={copy}
          className="size-6 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
          title="Share"
        >
          <PixelIcon name={copied ? "check" : "copy"} className="size-3" />
        </button>
        <button
          onClick={download}
          className="size-6 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
          title="Download"
        >
          <PixelIcon name="download" className="size-3" />
        </button>
        <Link
          href={`/?id=${bot.id}`}
          className="size-6 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors"
          title="Edit"
        >
          <PixelIcon name="pen-square" className="size-3" />
        </Link>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [bots, setBots] = useState(() => generateBatch(BATCH_SIZE));
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(
    () => setBots((prev) => [...prev, ...generateBatch(BATCH_SIZE)]),
    []
  );

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
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 sm:gap-2" style={{ gridAutoFlow: "dense" }}>
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-1" />
    </main>
  );
}
