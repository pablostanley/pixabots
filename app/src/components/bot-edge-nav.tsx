"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useKeydown } from "@/lib/use-keydown";
import { nextId, prevId } from "@/lib/bot-nav";
import { neighborInOrder, useBrowseOrder } from "@/lib/browse-order";

/**
 * Fixed-position left + right arrows. Used inside the browse bot-detail
 * dialog. Large hit area, small visual footprint, pinned to the screen
 * edges so they don't steal layout space from the dialog content.
 *
 * Navigation calls `onNavigate(nextId)` and shallow-updates the URL via
 * history.replaceState, so the dialog tree stays mounted and only
 * BotDetail's id prop changes. Using `router.replace` instead triggers a
 * Next route transition that repaints the scrim — the "flash" the user
 * saw before this refactor.
 *
 * When opened from /browse, walking left/right steps through the visible
 * grid order (via `useBrowseOrder`). Falls back to the canonical prev/
 * next combo index when the id isn't in that list (direct link, pre-
 * hydrate, etc.).
 *
 * Preloads the adjacent animated image via `<link rel="preload">` so the
 * swap doesn't decode-stall.
 *
 * Keyboard ← / → still work; guarded against form-field focus + modifiers.
 */
export function BotEdgeNav({
  id,
  onNavigate,
}: {
  id: string;
  onNavigate: (id: string) => void;
}) {
  const searchParams = useSearchParams();
  const order = useBrowseOrder();
  const prev = neighborInOrder(order, id, -1) ?? prevId(id);
  const next = neighborInOrder(order, id, 1) ?? nextId(id);

  const go = useCallback(
    (target: string) => {
      const qs = searchParams?.toString();
      window.history.replaceState(null, "", `/bot/${target}${qs ? `?${qs}` : ""}`);
      onNavigate(target);
    },
    [searchParams, onNavigate]
  );

  useKeydown(
    useCallback(
      (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(prev);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(next);
        }
      },
      [go, prev, next]
    )
  );

  const palette = searchParams?.toString();
  const preloadSrc = (target: string) =>
    `/api/pixabot/${target}?size=480&animated=true${palette ? `&${palette}` : ""}`;

  const btn =
    "pointer-events-auto fixed top-1/2 -translate-y-1/2 z-[60] " +
    "size-12 flex items-center justify-center text-foreground/70 hover:text-foreground " +
    "bg-background/70 backdrop-blur border border-border hover:bg-muted " +
    "transition-[transform,color,background-color] duration-150 ease-out " +
    "active:scale-[0.97]";

  return (
    <>
      {/* Preload both neighbors so the next nav is cache-hit instant */}
      <link rel="preload" as="image" href={preloadSrc(prev)} />
      <link rel="preload" as="image" href={preloadSrc(next)} />

      <button
        type="button"
        onClick={() => go(prev)}
        aria-label="Previous pixabot"
        data-tooltip="Previous (←)"
        className={`${btn} left-2 sm:left-6`}
      >
        <PixelIcon name="chevron-right" className="size-5 rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => go(next)}
        aria-label="Next pixabot"
        data-tooltip="Next (→)"
        className={`${btn} right-2 sm:right-6`}
      >
        <PixelIcon name="chevron-right" className="size-5" />
      </button>
    </>
  );
}
