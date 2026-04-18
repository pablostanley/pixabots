"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { randomId } from "@pixabots/core";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useShareOrCopy } from "@/lib/use-share-or-copy";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

const BATCH_SIZE = 60;
const FEATURED_EVERY = 8;
const MAX_BOTS = 600;

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

const DETAIL_SIZE = 480;

function BotCard({ bot }: { bot: BotCell }) {
  const [copied, share] = useShareOrCopy();
  const reducedMotion = usePrefersReducedMotion();
  const [fastRequested, setFastRequested] = useState(false);
  const [fastReady, setFastReady] = useState(false);
  const [hovered, setHovered] = useState(false);
  const prefetchedRef = useRef(false);
  const size = bot.featured ? DETAIL_SIZE : 240;
  const mainSrc = reducedMotion
    ? `/api/pixabot/${bot.id}?size=${size}`
    : `/api/pixabot/${bot.id}?size=${size}&animated=true`;
  const fastSrc = `/api/pixabot/${bot.id}?size=${size}&animated=true&speed=2`;
  const showFast = !reducedMotion && hovered && fastReady;

  const prefetchDetail = () => {
    if (prefetchedRef.current || size === DETAIL_SIZE) return;
    prefetchedRef.current = true;
    const img = new Image();
    img.src = `/api/pixabot/${bot.id}?size=${DETAIL_SIZE}&animated=true`;
  };

  const onCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    share({
      url: `${window.location.origin}/?id=${bot.id}`,
      title: `Pixabot ${bot.id}`,
      text: `Check out pixabot ${bot.id}`,
    });
  };

  const onDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = `/api/pixabot/${bot.id}?size=960`;
    link.download = `pixabot-${bot.id}.png`;
    link.click();
  };

  return (
    <Link
      href={`/bot/${bot.id}`}
      className={`group relative block bg-card border border-border overflow-hidden ${
        bot.featured ? "sm:col-span-2 sm:row-span-2" : ""
      }`}
      onMouseEnter={() => {
        setHovered(true);
        if (!reducedMotion) setFastRequested(true);
        prefetchDetail();
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-square">
        <img
          src={mainSrc}
          alt={`Pixabot ${bot.id}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${showFast ? "opacity-0" : "opacity-100"}`}
          style={{ imageRendering: "pixelated" }}
          loading="lazy"
        />
        {!reducedMotion && fastRequested && (
          <img
            src={fastSrc}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity ${showFast ? "opacity-100" : "opacity-0"}`}
            style={{ imageRendering: "pixelated" }}
            onLoad={() => setFastReady(true)}
            onError={() => setFastReady(true)}
          />
        )}
      </div>

      {/* Mobile: below image */}
      <div className="flex items-center gap-1 p-1 sm:hidden">
        <span className="font-mono text-sm text-muted-foreground mr-auto">{bot.id}</span>
        <button onClick={onCopy} className="size-6 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer" title={copied ? "Copied!" : "Share"}>
          <PixelIcon
            key={copied ? "copied" : "idle"}
            name={copied ? "check" : "copy"}
            className={`size-3 ${copied ? "animate-in zoom-in-50 fade-in-0 duration-200" : ""}`}
          />
        </button>
        <button onClick={onDownload} className="size-6 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer" title="Download">
          <PixelIcon name="download" className="size-3" />
        </button>
      </div>

      {/* Desktop: absolute overlay on hover */}
      <div className="hidden sm:flex absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto items-end p-2 bg-background/80">
        <div className="flex items-center gap-1 w-full">
          <span className="font-mono text-sm text-foreground mr-auto">{bot.id}</span>
          <button onClick={onCopy} className="size-7 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer" title={copied ? "Copied!" : "Share"}>
            <PixelIcon
              key={copied ? "copied" : "idle"}
              name={copied ? "check" : "copy"}
              className={`size-3.5 ${copied ? "animate-in zoom-in-50 fade-in-0 duration-200" : ""}`}
            />
          </button>
          <button onClick={onDownload} className="size-7 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer" title="Download">
            <PixelIcon name="download" className="size-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function BrowsePage() {
  const [bots, setBots] = useState(() => generateBatch(BATCH_SIZE));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setBots((prev) => {
      if (prev.length >= MAX_BOTS) return prev;
      return [...prev, ...generateBatch(BATCH_SIZE)];
    });
    // Release guard after React commits. setTimeout 0 pushes past current microtask.
    setTimeout(() => { loadingRef.current = false; }, 0);
  }, []);

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
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4" style={{ gridAutoFlow: "dense" }}>
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-1" />
    </main>
  );
}
