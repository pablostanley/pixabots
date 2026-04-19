"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useKeydown } from "@/lib/use-keydown";
import { nextId, prevId } from "@/lib/bot-nav";

/**
 * Fixed-position left + right arrows meant to live inside the browse
 * bot-detail dialog. Large hit area, small visual footprint, pinned to the
 * screen edges so they don't steal layout space from the dialog content.
 *
 * Also preloads the adjacent bot's animated image via `<link rel="preload">`
 * — when the user clicks, the next frame is already in the browser cache so
 * the image doesn't blink.
 *
 * Keyboard ← / → still work; guarded against form-field focus + modifiers.
 */
export function BotEdgeNav({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prev = prevId(id);
  const next = nextId(id);

  const go = useCallback(
    (target: string) => {
      const qs = searchParams?.toString();
      router.replace(`/bot/${target}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams]
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
