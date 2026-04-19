"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PixelIcon } from "@/components/ui/pixel-icon";

const BTN =
  "size-8 shrink-0 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer";

/**
 * Pair of controls for /bot/[id]: re-roll the palette, or clear it. Both
 * `router.replace` the current pathname so the detail's id stays put and
 * only the hue/saturate query params change. Saturation stays clamped to
 * 0.6–1.4 so the bot remains recognizable.
 */
export function PaletteShuffleButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active =
    searchParams?.get("hue") !== null || searchParams?.get("saturate") !== null;

  const shuffle = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturate = Number((0.6 + Math.random() * 0.8).toFixed(2));
    const qs = new URLSearchParams();
    qs.set("hue", String(hue));
    qs.set("saturate", saturate.toFixed(2));
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  const reset = () => {
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={shuffle}
        aria-label="Shuffle palette"
        data-tooltip="Shuffle palette"
        className={BTN}
      >
        <PixelIcon name="shuffle" className="size-4" />
      </button>
      {active && (
        <button
          type="button"
          onClick={reset}
          aria-label="Clear palette"
          data-tooltip="Clear palette"
          className={BTN}
        >
          <span aria-hidden="true" className="text-sm leading-none">↺</span>
        </button>
      )}
    </div>
  );
}
