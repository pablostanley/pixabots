"use client";

import { useState, useMemo } from "react";
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
  const src = `/api/pixabot/${bot.id}?size=${bot.featured ? 480 : 240}`;

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
    >
      <Link href={`/?id=${bot.id}`}>
        <img
          src={src}
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

  const bots = useMemo(
    () => Array.from({ length: batches }, () => generateBatch(BATCH_SIZE)).flat(),
    [batches]
  );

  return (
    <main className="flex-1 p-2 sm:p-4">
      <div
        className="grid gap-1 sm:gap-2"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gridAutoFlow: "dense",
        }}
      >
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>

      <div className="flex justify-center py-8">
        <button
          onClick={() => setBatches((b) => b + 1)}
          className="px-6 py-2 text-sm border border-border hover:bg-muted transition-colors cursor-pointer"
        >
          Load more
        </button>
      </div>
    </main>
  );
}
