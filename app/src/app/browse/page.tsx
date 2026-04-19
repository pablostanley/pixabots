"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  randomCombo,
  encode,
  CATEGORY_ORDER,
  PARTS,
  getPartIndex,
  partCount,
  totalCombinations,
  type PartCategory,
} from "@pixabots/core";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useKeydown } from "@/lib/use-keydown";
import { useShareOrCopy } from "@/lib/use-share-or-copy";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { setBrowseOrder } from "@/lib/browse-order";
import { FavoriteButton } from "@/components/favorite-button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const BATCH_SIZE = 60;
const FEATURED_EVERY = 8;
const MAX_BOTS = 600;
const DEEP_SCROLL_PX = 800;

function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}
function isDeep(): boolean {
  return window.scrollY > DEEP_SCROLL_PX;
}
function isDeepSsr(): boolean {
  return false;
}

interface BotCell {
  id: string;
  featured: boolean;
}

type Filters = Partial<Record<PartCategory, number>>;

function generateBatch(
  count: number,
  filters: Filters,
  offset: number,
  skipIds: ReadonlySet<string> = new Set()
): BotCell[] {
  // De-dupe against both `skipIds` (already rendered) and the new picks from
  // this batch. Heavy filters can shrink the unique pool below `count`, so
  // bail out after count*20 tries to avoid tight-looping on exhaustion.
  const bots: BotCell[] = [];
  const seen = new Set(skipIds);
  let placed = 0;
  for (let guard = 0; bots.length < count && guard < count * 20; guard++) {
    const combo = randomCombo();
    for (const cat of CATEGORY_ORDER) {
      const locked = filters[cat];
      if (locked !== undefined) combo[cat] = locked;
    }
    const id = encode(combo);
    if (seen.has(id)) continue;
    seen.add(id);
    bots.push({ id, featured: (placed + offset) % FEATURED_EVERY === 0 });
    placed++;
  }
  return bots;
}

function parseFilters(params: URLSearchParams): Filters {
  const out: Filters = {};
  for (const cat of CATEGORY_ORDER) {
    const value = params.get(cat);
    if (!value) continue;
    const idx = getPartIndex(cat, value);
    if (idx >= 0) out[cat] = idx;
  }
  return out;
}

/** Filtered combos = product of partCount(cat) for unfiltered categories. */
function matchCount(filters: Filters): number {
  let total = 1;
  for (const cat of CATEGORY_ORDER) {
    total *= filters[cat] !== undefined ? 1 : partCount(cat);
  }
  return total;
}

function FilterBar({
  filters,
  onChange,
  onReroll,
  compareHref,
}: {
  filters: Filters;
  onChange: (cat: PartCategory, value: string | null) => void;
  onReroll: () => void;
  compareHref: string | null;
}) {
  const active = Object.keys(filters).length > 0;
  const count = active ? matchCount(filters) : totalCombinations();
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4 px-2 text-sm">
      <span className="text-muted-foreground mr-1">Filter</span>
      <span className="font-mono text-xs text-muted-foreground mr-1" aria-live="polite">
        {count.toLocaleString()} {count === 1 ? "bot" : "bots"}
      </span>
      {CATEGORY_ORDER.map((cat) => {
        const selectedIdx = filters[cat];
        const label = cat === "eyes" ? "face" : cat;
        const selectedName = selectedIdx !== undefined ? PARTS[cat][selectedIdx].name : null;
        return (
          <DropdownMenu key={cat}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`px-2 py-1 border transition-colors cursor-pointer ${
                  selectedName
                    ? "border-foreground bg-foreground/10"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                {label}
                {selectedName ? `: ${selectedName}` : ""}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              <DropdownMenuItem onClick={() => onChange(cat, null)} className="text-sm font-medium">
                Any {label}
              </DropdownMenuItem>
              {PARTS[cat].map((p) => (
                <DropdownMenuItem
                  key={p.name}
                  onClick={() => onChange(cat, p.name)}
                  className={`text-sm ${p.name === selectedName ? "bg-accent" : ""}`}
                >
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
      {compareHref && (
        <Link
          href={compareHref}
          className="ml-auto flex items-center gap-1 px-2 py-1 text-xs border border-border hover:bg-muted transition-colors"
          data-tooltip="Compare the first 6 in this grid"
        >
          Compare top 6
        </Link>
      )}
      <button
        type="button"
        onClick={onReroll}
        className={`${compareHref ? "" : "ml-auto "}flex items-center gap-1 px-2 py-1 text-xs border border-border hover:bg-muted cursor-pointer`}
        data-tooltip="Regenerate the grid"
        aria-label="Reroll grid"
      >
        <PixelIcon name="shuffle" className="size-3" />
        Reroll
      </button>
      {active && (
        <button
          type="button"
          onClick={() => {
            for (const cat of CATEGORY_ORDER) onChange(cat, null);
          }}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  );
}

const DETAIL_SIZE = 480;

function BotCard({ bot }: { bot: BotCell }) {
  const [copied, share] = useShareOrCopy();
  const reducedMotion = usePrefersReducedMotion();
  const [fastRequested, setFastRequested] = useState(false);
  const [fastReady, setFastReady] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mainLoaded, setMainLoaded] = useState(false);
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
      className={`group relative block bg-card border border-border ${
        bot.featured ? "sm:col-span-2 sm:row-span-2" : ""
      }`}
      onMouseEnter={() => {
        setHovered(true);
        if (!reducedMotion) setFastRequested(true);
        prefetchDetail();
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <div
          aria-hidden="true"
          className={`absolute inset-0 bg-muted motion-safe:animate-pulse transition-opacity duration-300 ${mainLoaded ? "opacity-0" : "opacity-100"}`}
        />
        <img
          src={mainSrc}
          alt={`Pixabot ${bot.id}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${showFast ? "opacity-0" : "opacity-100"}`}
          style={{ imageRendering: "pixelated" }}
          loading="lazy"
          onLoad={() => setMainLoaded(true)}
          onError={() => setMainLoaded(true)}
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
        <FavoriteButton id={bot.id} size="sm" />
        <button onClick={onCopy} className="size-6 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer" data-tooltip={copied ? "Copied!" : "Share"} aria-label="Share">
          <PixelIcon
            key={copied ? "copied" : "idle"}
            name={copied ? "check" : "copy"}
            className={`size-3 ${copied ? "animate-in zoom-in-95 fade-in-0 duration-150 ease-out" : ""}`}
          />
        </button>
        <button onClick={onDownload} className="size-6 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer" data-tooltip="Download" aria-label="Download">
          <PixelIcon name="download" className="size-3" />
        </button>
      </div>

      {/* Desktop: absolute overlay on hover */}
      <div className="hidden sm:flex absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto items-end p-2 bg-background/80">
        <div className="flex items-center gap-1 w-full">
          <span className="font-mono text-sm text-foreground mr-auto">{bot.id}</span>
          <FavoriteButton id={bot.id} />
          <button onClick={onCopy} className="size-7 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer" data-tooltip={copied ? "Copied!" : "Share"} aria-label="Share">
            <PixelIcon
              key={copied ? "copied" : "idle"}
              name={copied ? "check" : "copy"}
              className={`size-3.5 ${copied ? "animate-in zoom-in-95 fade-in-0 duration-150 ease-out" : ""}`}
            />
          </button>
          <button onClick={onDownload} className="size-7 shrink-0 flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors cursor-pointer" data-tooltip="Download" aria-label="Download">
            <PixelIcon name="download" className="size-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}

function BrowseInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const [bots, setBots] = useState(() => generateBatch(BATCH_SIZE, filters, 0));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Regenerate when filters change
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setBots(generateBatch(BATCH_SIZE, filters, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setBots((prev) => {
      if (prev.length >= MAX_BOTS) return prev;
      const seen = new Set(prev.map((b) => b.id));
      return [...prev, ...generateBatch(BATCH_SIZE, filters, prev.length, seen)];
    });
    setTimeout(() => { loadingRef.current = false; }, 0);
  }, [filters]);

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

  const setFilter = useCallback(
    (cat: PartCategory, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(cat, value);
      else params.delete(cat);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const reroll = useCallback(() => {
    setBots(generateBatch(BATCH_SIZE, filters, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters]);

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  useKeydown(
    useCallback(
      (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === "Escape" && Object.keys(filters).length > 0) {
          e.preventDefault();
          clearFilters();
        }
      },
      [filters, clearFilters]
    )
  );

  const compareHref =
    bots.length >= 2 ? `/compare?ids=${bots.slice(0, 6).map((b) => b.id).join(",")}` : null;

  // Publish the visible grid order so the intercepted bot dialog can page
  // through "what the user sees" instead of the canonical combo index.
  // Idempotent on unchanged lists (see lib/browse-order).
  setBrowseOrder(bots.map((b) => b.id));

  const deepScrolled = useSyncExternalStore(subscribeScroll, isDeep, isDeepSsr);

  return (
    <main className="flex-1 p-2 sm:p-4">
      <FilterBar filters={filters} onChange={setFilter} onReroll={reroll} compareHref={compareHref} />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4" style={{ gridAutoFlow: "dense" }}>
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-1" />
      {deepScrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          data-tooltip="Scroll to top"
          className="fixed bottom-4 right-4 z-30 size-10 flex items-center justify-center border border-border bg-background/90 backdrop-blur hover:bg-muted transition-colors cursor-pointer motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
        >
          <span aria-hidden="true" className="text-lg leading-none">↑</span>
        </button>
      )}
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<main className="flex-1 p-2 sm:p-4" />}>
      <BrowseInner />
    </Suspense>
  );
}
