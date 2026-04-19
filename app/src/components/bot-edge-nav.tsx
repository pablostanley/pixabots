"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useKeydown } from "@/lib/use-keydown";
import { nextId, prevId, comboToIndex } from "@/lib/bot-nav";
import { neighborInOrder, useBrowseOrder } from "@/lib/browse-order";
import { botHref } from "@/lib/bot-href";
import { useSfx } from "@/lib/use-sfx";

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
  const sfx = useSfx();
  const prev = neighborInOrder(order, id, -1) ?? prevId(id);
  const next = neighborInOrder(order, id, 1) ?? nextId(id);

  const go = useCallback(
    (target: string) => {
      window.history.replaceState(null, "", botHref(target, searchParams));
      onNavigate(target);
      // Pitch tracks the combo index so walking the grid plays a melody
      // instead of the same note. "cycle" voice, eyes scale — same timbre
      // the creator uses when cycling a part, so the site stays one
      // instrument.
      sfx.play({ kind: "cycle", category: "eyes", index: comboToIndex(target) });
    },
    [searchParams, onNavigate, sfx]
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
  const prevPreload = preloadSrc(prev);
  const nextPreload = preloadSrc(next);

  const btn =
    "pointer-events-auto fixed top-1/2 -translate-y-1/2 z-[60] " +
    "size-14 sm:size-16 flex items-center justify-center cursor-pointer " +
    "text-foreground/50 hover:text-foreground " +
    "transition-[transform,color] duration-150 ease-out active:scale-[0.92]";

  return (
    <>
      {/* key on href forces fresh preload on every nav; mutating the
          attribute in place doesn't reliably retrigger the fetch hint. */}
      <link key={prevPreload} rel="preload" as="image" href={prevPreload} />
      <link key={nextPreload} rel="preload" as="image" href={nextPreload} />

      <button
        type="button"
        onClick={() => go(prev)}
        aria-label="Previous pixabot"
        data-tooltip="Previous (←)"
        className={`${btn} left-0 sm:left-2`}
      >
        <PixelIcon name="chevron-right" className="size-5 rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => go(next)}
        aria-label="Next pixabot"
        data-tooltip="Next (→)"
        className={`${btn} right-0 sm:right-2`}
      >
        <PixelIcon name="chevron-right" className="size-5" />
      </button>
    </>
  );
}
